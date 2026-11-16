import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  FileVideo,
  ScanText,
} from 'lucide-react';
import { computeBlobSha256 } from '../../utils/cryptoHash';

export interface CapturedProofData {
  videoFile: File;
  keyframeFile: File | null;
  sha256Hash: string;
  lat: number | null;
  lng: number | null;
  previewUrl: string;
  extractedFramePreview: string | null;
  mode: 'LIVE_WEBRTC' | 'VIDEO_UPLOAD_OCR';
}

interface Props {
  onProofCaptured: (proof: CapturedProofData) => void;
}

export const LiveProofRecorder: React.FC<Props> = ({ onProofCaptured }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [tab, setTab] = useState<'UPLOAD_OCR' | 'LIVE_CAMERA'>('UPLOAD_OCR');
  const [streamActive, setStreamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [processingVideoOcr, setProcessingVideoOcr] = useState(false);
  const [captured, setCaptured] = useState<CapturedProofData | null>(null);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: 6.2105,
    lng: 7.0722,
  });
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 6.2105, lng: 7.0722 })
      );
    }
    return () => stopCameraStream();
  }, []);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Extracts a crisp JPEG frame at 1.0s from an uploaded video file for Gemini Vision OCR
  const extractFrameFromVideoFile = (file: File): Promise<{ frameFile: File | null; frameDataUrl: string | null }> => {
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      tempVideo.src = objectUrl;

      tempVideo.onloadeddata = () => {
        tempVideo.currentTime = Math.min(1.0, (tempVideo.duration || 2) / 2);
      };

      tempVideo.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 640;
        canvas.height = tempVideo.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return resolve({ frameFile: null, frameDataUrl: null });
        }
        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return resolve({ frameFile: null, frameDataUrl });
            const frameFile = new File([blob], `video_ocr_frame_${Date.now()}.jpg`, { type: 'image/jpeg' });
            resolve({ frameFile, frameDataUrl });
          },
          'image/jpeg',
          0.85
        );
      };

      tempVideo.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ frameFile: null, frameDataUrl: null });
      };
    });
  };

  // Handler for Video File Upload + Automatic Frame Extraction & SHA-256 Hashing
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setProcessingVideoOcr(true);

    try {
      const sha256Hash = await computeBlobSha256(file);
      const { frameFile, frameDataUrl } = await extractFrameFromVideoFile(file);
      const previewUrl = URL.createObjectURL(file);

      const result: CapturedProofData = {
        videoFile: file,
        keyframeFile: frameFile,
        sha256Hash,
        lat: coords.lat,
        lng: coords.lng,
        previewUrl,
        extractedFramePreview: frameDataUrl,
        mode: 'VIDEO_UPLOAD_OCR',
      };

      setCaptured(result);
      onProofCaptured(result);
    } catch {
      setCameraError('Could not process uploaded video for OCR analysis.');
    } finally {
      setProcessingVideoOcr(false);
    }
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch {
      setCameraError('Camera access unavailable on this device. Use the "Video Upload + AI OCR" tab instead.');
    }
  };

  const startRecording = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    chunksRef.current = [];

    // Capture keyframe from live video
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const keyframeBlob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    const keyframeFile = keyframeBlob
      ? new File([keyframeBlob], `live_frame_${Date.now()}.jpg`, { type: 'image/jpeg' })
      : null;

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/mp4';

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const videoFile = new File([blob], `confam_live_${Date.now()}.${ext}`, { type: blob.type });
      const sha256Hash = await computeBlobSha256(blob);
      const previewUrl = URL.createObjectURL(blob);

      stopCameraStream();
      const result: CapturedProofData = {
        videoFile,
        keyframeFile,
        sha256Hash,
        lat: coords.lat,
        lng: coords.lng,
        previewUrl,
        extractedFramePreview: frameDataUrl,
        mode: 'LIVE_WEBRTC',
      };
      setCaptured(result);
      onProofCaptured(result);
    };

    setRecording(true);
    setSecondsLeft(8);
    recorder.start(250);

    let count = 8;
    const timer = setInterval(() => {
      count -= 1;
      setSecondsLeft(count);
      if (count <= 0) {
        clearInterval(timer);
        if (recorder.state === 'recording') {
          recorder.stop();
          setRecording(false);
        }
      }
    }, 1000);
  };

  return (
    <div className="iz-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shadow-md">
            <ScanText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-white">
              Proof-of-Pack Video & Gemini 3.8 Video OCR
            </h3>
            <p className="text-[11px] text-[#9496A1]">
              Upload packing video or record live — AI extracts serials, labels & waybill text from video frames
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-full bg-[#0B0B10] p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              setTab('UPLOAD_OCR');
            }}
            className={`px-3 py-1 rounded-full font-display font-medium transition cursor-pointer ${
              tab === 'UPLOAD_OCR' ? 'bg-[#7C5CFC] text-white' : 'text-[#9496A1] hover:text-white'
            }`}
          >
            Video Upload (OCR)
          </button>
          <button
            type="button"
            onClick={() => setTab('LIVE_CAMERA')}
            className={`px-3 py-1 rounded-full font-display font-medium transition cursor-pointer ${
              tab === 'LIVE_CAMERA' ? 'bg-[#7C5CFC] text-white' : 'text-[#9496A1] hover:text-white'
            }`}
          >
            Live WebRTC Cam
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444]">
          {cameraError}
        </div>
      )}

      {/* TAB 1: Video File Upload for Gemini 3.8 Video OCR */}
      {tab === 'UPLOAD_OCR' && !captured && (
        <label className="block w-full py-8 px-4 rounded-2xl border-2 border-dashed border-[#7C5CFC]/40 hover:border-[#7C5CFC] bg-[#0B0B10]/70 text-center cursor-pointer transition">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            onChange={handleVideoFileUpload}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 flex items-center justify-center text-[#9B82FF] mx-auto mb-3">
            <FileVideo className="w-6 h-6" />
          </div>
          <div className="font-display font-semibold text-sm text-white">
            {processingVideoOcr
              ? 'Extracting Video Keyframe & Computing SHA-256 Hash...'
              : 'Click to Upload Packing Video (.MP4, .WEBM, .MOV)'}
          </div>
          <p className="text-xs text-[#9496A1] mt-1 max-w-md mx-auto">
            Gemini 3.8 Flash scans the uploaded video stream to verify item condition and OCR any visible waybill or serial labels.
          </p>
        </label>
      )}

      {/* TAB 2: Live WebRTC Stream */}
      {tab === 'LIVE_CAMERA' && !streamActive && !captured && (
        <button
          type="button"
          onClick={startLiveCamera}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-[#7C5CFC]/40 hover:border-[#7C5CFC] bg-[#0B0B10]/70 flex flex-col items-center justify-center gap-2 transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg">
            <Camera className="w-5 h-5" />
          </div>
          <span className="font-display font-semibold text-sm text-white">
            Launch Live WebRTC Anti-Fraud Camera
          </span>
          <span className="text-xs text-[#9496A1]">Records an 8-second live packing clip</span>
        </button>
      )}

      {streamActive && (
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0B0B10]">
          <div className="relative">
            <video ref={videoRef} muted playsInline className="w-full h-60 object-cover" />
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-[11px] font-mono-tabular bg-[#0B0B10]/85 px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-[#10B981] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                WEBRTC STREAM
              </span>
              <span className="text-white/80 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7C5CFC]" />
                {coords.lat?.toFixed(4)}, {coords.lng?.toFixed(4)}
              </span>
            </div>
          </div>
          <div className="p-3 bg-[#13131F] flex justify-center">
            {!recording ? (
              <button type="button" onClick={startRecording} className="iz-btn-pill w-full">
                Start 8-Second Video OCR Capture
              </button>
            ) : (
              <div className="w-full py-2.5 rounded-full bg-[#EF4444] text-white font-mono-tabular font-bold text-xs text-center">
                ● RECORDING STREAM... 00:0{secondsLeft}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Captured Video + Extracted OCR Keyframe Preview */}
      {captured && (
        <div className="rounded-2xl bg-[#0B0B10] border border-[#7C5CFC]/40 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-mono-tabular uppercase text-[#9496A1] block mb-1">
                1. Uploaded / Recorded Video Stream
              </span>
              <video
                src={captured.previewUrl}
                controls
                className="w-full h-40 object-cover rounded-xl border border-white/10"
              />
            </div>

            {captured.extractedFramePreview && (
              <div>
                <span className="text-[10px] font-mono-tabular uppercase text-[#10B981] block mb-1">
                  2. Extracted Frame for Gemini 3.8 Video OCR
                </span>
                <img
                  src={captured.extractedFramePreview}
                  alt="Extracted Video OCR Frame"
                  className="w-full h-40 object-cover rounded-xl border border-[#10B981]/40"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-display font-semibold text-[#10B981] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {captured.mode === 'VIDEO_UPLOAD_OCR'
                ? 'Video Uploaded & OCR Keyframe Extracted'
                : 'Live WebRTC Stream Locked'}
            </span>
            <button
              type="button"
              onClick={() => setCaptured(null)}
              className="text-xs text-[#9B82FF] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace Video
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-[#13131F] border border-white/10 text-[11px] font-mono-tabular text-[#9496A1] break-all">
            <strong className="text-white">SHA-256 VIDEO HASH: </strong>
            {captured.sha256Hash}
          </div>
        </div>
      )}
    </div>
  );
};