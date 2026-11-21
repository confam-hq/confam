import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, MapPin } from "lucide-react";
import { driverApi } from "../api/dealApi";
import { errMsg } from "../api/client";
import ConfamLogo from "../components/layout/ConfamLogo";
import { useToast } from "../context/useToast";

export default function DriverPingPage() {
  const { token = "" } = useParams();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  const toast = useToast();

  const ping = () => {
    setErr("");
    if (!navigator.geolocation) {
      const message = "GPS not supported on this phone";
      setErr(message);
      toast.error("Location unavailable", message);
      return;
    }
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          await driverApi.ping(token, p.coords.latitude, p.coords.longitude);
          setState("done");
          toast.success("Location sent", "The vendor and buyer can now see your check-in.");
        } catch (e) {
          const message = errMsg(e, "Could not send your location.");
          setErr(message);
          toast.error("Driver check-in failed", message);
          setState("idle");
        }
      },
      () => {
        const message = "Please allow location access";
        setErr(message);
        toast.error("Location permission needed", message);
        setState("idle");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div className="mx-auto grid max-w-sm place-items-center px-4 py-16 text-center">
      <ConfamLogo size={32} />
      <div className="card mt-8 w-full p-6">
        {state === "done" ? (
          <>
            <CheckCircle2 className="mx-auto mb-3 text-brand" size={40} />
            <p className="font-medium">Location sent</p>
            <p className="mt-1 text-xs text-muted">Thank you. The vendor and buyer can see your check-in.</p>
            <button onClick={() => setState("idle")} className="btn-ghost mt-5 w-full">Ping again</button>
          </>
        ) : (
          <>
            <MapPin className="mx-auto mb-3 text-brand" size={40} />
            <p className="font-medium">Driver check-in</p>
            <p className="mb-5 mt-1 text-xs text-muted">Tap once to share where the parcel is. No app needed.</p>
            {err && <p className="mb-3 text-xs text-red-500">{err}</p>}
            <button onClick={ping} disabled={state === "busy"} className="btn-primary h-12 w-full text-base">
              {state === "busy" ? "Getting location…" : "I'm here — send location"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}