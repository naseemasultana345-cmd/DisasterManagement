
import { useState } from "react";

import {
  Activity,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  KeyRound,
} from "lucide-react";

import "./ForgotPassword.css";

const API_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getErrorMessage = async (response) => {
    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (data.message) {
        return data.message;
      }
    } catch {
      // Response is plain text
    }

    return text || "Something went wrong.";
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(response);
        throw new Error(message);
      }

      setEmail(cleanEmail);
      setOtpSent(true);

      setSuccessMessage(
        "OTP sent successfully. Please check your email."
      );
    } catch (error) {
      console.error("Send OTP error:", error);

      setErrorMessage(
        error.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMessage("OTP must contain 6 digits.");
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );

      if (!response.ok) {
        const message = await getErrorMessage(response);
        throw new Error(message);
      }

      const data = await response.json();

      sessionStorage.setItem(
        "resetEmail",
        email.trim().toLowerCase()
      );

      sessionStorage.setItem(
        "resetToken",
        data.resetToken
      );

      setSuccessMessage(
        "OTP verified successfully. Redirecting..."
      );

      setTimeout(() => {
        window.location.href = "/reset-password";
      }, 700);
    } catch (error) {
      console.error("OTP verification error:", error);

      setErrorMessage(
        error.message ||
          "Unable to verify OTP."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="forgot-page">

      {/* Background */}
      <div className="forgot-background-glow glow-one"></div>
      <div className="forgot-background-glow glow-two"></div>
      <div className="forgot-grid"></div>

      {/* Main Card */}
      <div className="forgot-panel">

        {/* Brand */}
        <div className="forgot-brand">

          <div className="forgot-logo">
            <Activity size={23} strokeWidth={2.4} />
          </div>

          <div className="forgot-brand-text">
            <strong>
              Disaster<span>Safe</span>
            </strong>

            <small>
              Emergency Management
            </small>
          </div>

        </div>

        {/* Header */}
        <div className="forgot-header">

          <div className="forgot-icon">
            <KeyRound size={25} strokeWidth={2.2} />
          </div>

          <div className="forgot-label">
            {otpSent
              ? "VERIFY YOUR IDENTITY"
              : "PASSWORD RECOVERY"}
          </div>

          <h2>
            {otpSent
              ? "Verify your OTP"
              : "Forgot your password?"}
          </h2>

          <p>
            {otpSent
              ? "Enter the 6-digit OTP sent to your registered email address."
              : "Enter your registered email address and we will send you a 6-digit OTP."}
          </p>

        </div>

        {/* Error */}
        {errorMessage && (
          <div
            className="forgot-message forgot-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div
            className="forgot-message forgot-success"
            role="status"
          >
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Email Form */}
        {!otpSent ? (
          <form
            className="forgot-form"
            onSubmit={handleSendOtp}
          >

            <div className="forgot-field">

              <label htmlFor="forgot-email">
                Email address
              </label>

              <div className="forgot-field-wrapper">

                <Mail
                  size={18}
                  className="forgot-field-icon"
                />

                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                  }}
                  autoComplete="email"
                  inputMode="email"
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="forgot-primary-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="forgot-spinner"></span>
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        ) : (
          /* OTP Form */
          <form
            className="forgot-form"
            onSubmit={handleVerifyOtp}
          >

            <div className="otp-email-display">

              <div className="otp-email-icon">
                <Mail size={16} />
              </div>

              <div>
                <span>OTP sent to</span>
                <strong>{email}</strong>
              </div>

            </div>

            <div className="forgot-field">

              <label htmlFor="otp">
                Enter OTP
              </label>

              <div className="forgot-field-wrapper">

                <KeyRound
                  size={18}
                  className="forgot-field-icon"
                />

                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                    setOtp(value);
                    setErrorMessage("");
                  }}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="forgot-primary-button"
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <span className="forgot-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              className="change-email-button"
              onClick={handleChangeEmail}
            >
              Use a different email
            </button>

          </form>
        )}

        {/* Security */}
        <div className="forgot-security">

          <div className="forgot-security-icon">
            <ShieldCheck size={18} />
          </div>

          <div>
            <strong>
              Secure password recovery
            </strong>

            <span>
              Your OTP is valid for 5 minutes.
            </span>
          </div>

        </div>

        {/* Back */}
        <a
          href="/login"
          className="back-login-link"
        >
          <span>←</span>
          Back to Sign in
        </a>

      </div>

      {/* Footer */}
      <div className="forgot-footer">
        <span>DisasterSafe</span>
        <span>•</span>
        <span>Emergency Assistance & Safety</span>
      </div>

    </div>
  );
}

export default ForgotPassword;

