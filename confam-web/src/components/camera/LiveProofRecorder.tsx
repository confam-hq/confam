import { useEffect, useRef, useState } from "react";
import { Circle, RotateCcw, Square } from "lucide-react";
import { computeBlobSha256 } from "../../utils/cryptoHash";

export default function LiveProofRecorder({
  onReady,
  maxSeconds = 30,
}: {
  onReady: (blob: Blob, sha256: string) => void;
  maxSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera access denied. Allow camera and microphone to record proof.");
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    start();
    return stopStream;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setSecs((s) => {
        if (s + 1 >= maxSeconds) stop();
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [recording]);

  const begin = () => {
    if (!streamRef.current) return;
    chunks.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" : "";
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
      onReady(blob, await computeBlobSha256(blob));
    };
    rec.start();
    recRef.current = rec;
    setSecs(0);
    setRecording(true);
  };

  const stop = () => {
    if (recRef.current?.state === "recording") recRef.current.stop();
    setRecording(false);
  };

  const retake = () => {
    setPreviewUrl(null);
    start();
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-black">
        {previewUrl ? (
          <video src={previewUrl} controls playsInline className="h-full w-full" />
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
        {recording && (
          <span className="font-mono-tabular absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            0:{String(secs).padStart(2, "0")}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {previewUrl ? (
        <button onClick={retake} className="btn-ghost w-full"><RotateCcw size={14} /> Retake</button>
      ) : recording ? (
        <button onClick={stop} className="btn-primary w-full"><Square size={14} /> Stop recording</button>
      ) : (
        <button onClick={begin} disabled={!!error} className="btn-primary w-full"><Circle size={14} /> Record proof of pack</button>
      )}
    </div>
  );
}