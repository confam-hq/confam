import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import { errMsg } from "../../api/client";
import { authApi } from "../../api/dealApi";
import { useToast } from "../../context/useToast";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const [email] = useState(stateEmail || sessionStorage.getItem("confam.pendingVerificationEmail") || "");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const code = digits.join("");

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    setDigits((current) => current.map((_, index) => pasted[index] ?? ""));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.verifyEmail(email, code);
      sessionStorage.removeItem("confam.pendingVerificationEmail");
      toast.success("Email verified", "You can now sign in to Confam.");
      navigate("/login", { replace: true });
    } catch (cause) {
      const message = errMsg(cause, "Could not verify your email.");
      setError(message);
      toast.error("Verification failed", message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      const result = await authApi.resendVerification(email);
      toast.info("Check your inbox", result.message);
    } catch (cause) {
      const message = errMsg(cause, "Could not send another verification code.");
      setError(message);
      toast.error("Code could not be sent", message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="EMAIL VERIFICATION"
      title="Verify your email."
      description="Enter the six-digit code we sent you. It expires after 10 minutes."
    >
      <form onSubmit={verify} className="neo-card space-y-5 rounded-3xl p-5 sm:p-7">
        {!email && (
          <p role="alert" className="text-sm text-red-500">
            No verification account was found. <Link to="/register" className="font-semibold underline">Create an account</Link>.
          </p>
        )}
        <fieldset disabled={busy}>
          <legend className="label mb-3 text-center">Verification code</legend>
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                aria-label={`Verification code digit ${index + 1}`}
                required
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                pattern="[0-9]"
                maxLength={1}
                className="input neo-inset font-mono-tabular h-14 w-12 rounded-xl text-center text-xl sm:w-14"
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onPaste={handlePaste}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digit && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button disabled={busy || code.length !== 6 || !email} className="btn-primary min-h-14 w-full rounded-2xl text-base">
          {busy ? "Verifying…" : "Verify email"}
        </button>
        <button type="button" disabled={resending || !email} onClick={resend} className="btn-ghost min-h-11 w-full">
          {resending ? "Sending code…" : "Resend verification code"}
        </button>
        <p className="text-center text-sm text-muted">Already verified? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
      </form>
    </AuthSplitLayout>
  );
}
