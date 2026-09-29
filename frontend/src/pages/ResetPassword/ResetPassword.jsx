import { useEffect, useState } from "react";

import {
  Activity,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  KeyRound,
} from "lucide-react";

import "./ResetPassword.css";

const API_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com/api";

function ResetPassword() {
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    const storedEmail =
      sessionStorage.getItem("resetEmail");

    const resetToken =
      sessionStorage.getItem("resetToken");

    if (!storedEmail || !resetToken) {
      window.location.href = "/forgot-password";
      return;
    }

    setEmail(storedEmail);
  }, []);

  const getErrorMessage = async (response) => {
    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (data.message) {
        return data.message;
      }
    } catch {
      // Plain text response
    }

    return text || "Something went wrong.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage(
        "Please enter and confirm your new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }

    const resetToken =
      sessionStorage.getItem("resetToken");

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            resetToken,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const message =
          await getErrorMessage(response);

        throw new Error(message);
      }

      setSuccessMessage(
        "Password updated successfully. Redirecting to Sign in..."
      );

      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetToken");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">

      {/* Background */}
      <div className="reset-background-glow reset-glow-one"></div>
      <div className="reset-background-glow reset-glow-two"></div>
      <div className="reset-grid"></div>

      {/* Main Card */}
      <div className="reset-panel">

        {/* Brand */}
        <div className="reset-brand">

          <div className="reset-logo">
            <Activity
              size={23}
              strokeWidth={2.4}
            />
          </div>

          <div className="reset-brand-text">
            <strong>
              Disaster<span>Safe</span>
            </strong>

            <small>
              Emergency Management
            </small>
          </div>

        </div>

        {/* Header */}
        <div className="reset-header">

          <div className="reset-icon">
            <KeyRound
              size={24}
              strokeWidth={2.2}
            />
          </div>

          <div className="reset-label">
            CREATE NEW PASSWORD
          </div>

          <h2>
            Reset your password
          </h2>

          <p>
            Create a new secure password for your
            DisasterSafe account.
          </p>

        </div>

        {/* Error */}
        {errorMessage && (
          <div
            className="reset-message reset-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div
            className="reset-message reset-success"
            role="status"
          >
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form
          className="reset-form"
          onSubmit={handleSubmit}
        >

          {/* New Password */}
          <div className="reset-field">

            <label htmlFor="new-password">
              Enter new password
            </label>

            <div className="reset-field-wrapper">

              <Lock
                size={18}
                className="reset-field-icon"
              />

              <input
                id="new-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(
                    event.target.value
                  );
                  setErrorMessage("");
                }}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="reset-eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* Confirm Password */}
          <div className="reset-field">

            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <div className="reset-field-wrapper">

              <Lock
                size={18}
                className="reset-field-icon"
              />

              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );
                  setErrorMessage("");
                }}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="reset-eye"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* Requirement */}
          <div className="password-requirement">
            <span className="requirement-dot"></span>
            Password must contain at least 8 characters.
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="reset-primary-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="reset-spinner"></span>
                Updating password...
              </>
            ) : (
              <>
                Update Password
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        {/* Security */}
        <div className="reset-security">

          <div className="reset-security-icon">
            <ShieldCheck size={18} />
          </div>

          <div>
            <strong>
              Secure password update
            </strong>

            <span>
              Your password reset session is temporary.
            </span>
          </div>

        </div>

        {/* Back */}
        <a
          href="/login"
          className="reset-back-login"
        >
          <span>←</span>
          Back to Sign in
        </a>

      </div>

      {/* Footer */}
      <div className="reset-footer">
        <span>DisasterSafe</span>
        <span>•</span>
        <span>Emergency Assistance & Safety</span>
      </div>

    </div>
  );
}

export default ResetPassword;
