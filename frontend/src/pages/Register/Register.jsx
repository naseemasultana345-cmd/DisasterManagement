import { useState } from "react";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import "./Register.css";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com/api";

const OAUTH_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com";

// ============================================================
// REGISTER COMPONENT
// ============================================================

function Register() {
  // ==========================================================
  // FORM STATES
  // ==========================================================

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==========================================================
  // OTHER STATES
  // ==========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ==========================================================
  // REGISTER USER
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || socialLoading) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    // ========================================================
    // REQUIRED FIELD VALIDATION
    // ========================================================

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedPhone ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage(
        "Please fill in all fields."
      );
      return;
    }

    // ========================================================
    // NAME VALIDATION
    // ========================================================

    if (trimmedName.length < 2) {
      setErrorMessage(
        "Please enter your full name."
      );
      return;
    }

    // ========================================================
    // EMAIL VALIDATION
    // ========================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    // ========================================================
    // PHONE VALIDATION
    // ========================================================

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(trimmedPhone)) {
      setErrorMessage(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    // ========================================================
    // PASSWORD VALIDATION
    // ========================================================

    if (password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters long."
      );
      return;
    }

    // ========================================================
    // CONFIRM PASSWORD
    // ========================================================

    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }

    // ========================================================
    // START REGISTRATION
    // ========================================================

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept:
              "application/json, text/plain",
          },

          body: JSON.stringify({
            fullName: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password: password,
          }),
        }
      );

      // ======================================================
      // HANDLE RESPONSE
      // ======================================================

      const contentType =
        response.headers.get(
          "content-type"
        );

      let data;

      if (
        contentType &&
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      if (response.ok) {
        const message =
          typeof data === "string"
            ? data
            : data?.message ||
              "Registration successful! Please sign in.";

        setSuccessMessage(message);

        console.log(
          "Registered user:",
          data
        );

        // Clear form
        setFullName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to Login
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);

        return;
      }

      // ======================================================
      // FAILURE
      // ======================================================

      const message =
        typeof data === "string"
          ? data
          : data?.message ||
            data?.error ||
            "Registration failed.";

      setErrorMessage(message);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setErrorMessage(
        "Unable to connect to the backend. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // GOOGLE REGISTRATION
  // ==========================================================

  const handleGoogleRegister = () => {
    if (loading || socialLoading) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setSocialLoading("google");

    window.location.href =
      `${OAUTH_BASE_URL}/oauth2/authorization/google`;
  };

  // ==========================================================
  // GITHUB REGISTRATION
  // ==========================================================

  const handleGithubRegister = () => {
    if (loading || socialLoading) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setSocialLoading("github");

    window.location.href =
      `${OAUTH_BASE_URL}/oauth2/authorization/github`;
  };

  // ==========================================================
  // CLEAR MESSAGES
  // ==========================================================

  const clearMessages = () => {
    if (errorMessage || successMessage) {
      setErrorMessage("");
      setSuccessMessage("");
    }
  };

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <div className="register-page">

      {/* ====================================================
          BACKGROUND
      ==================================================== */}

      <div className="register-background-glow glow-one"></div>
      <div className="register-background-glow glow-two"></div>
      <div className="register-grid"></div>

      {/* ====================================================
          REGISTER PANEL
      ==================================================== */}

      <div className="register-panel">

        <div className="register-panel-inner">

          {/* =================================================
              BRAND
          ================================================= */}

          <div className="register-brand">

            <div className="register-brand-logo">
              <Activity size={23} />
            </div>

            <div>
              <strong>
                Disaster<span>Safe</span>
              </strong>

              <small>
                Emergency Management
              </small>
            </div>

          </div>

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="register-header">

            <div className="register-welcome-label">
              GET STARTED
            </div>

            <h2>
              Create your account
            </h2>

            <p>
              Register to stay prepared,
              connected and protected.
            </p>

          </div>

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {errorMessage && (
            <div
              className="register-message register-error"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle size={18} />

              <span>
                {errorMessage}
              </span>
            </div>
          )}

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {successMessage && (
            <div
              className="register-message register-success"
              role="status"
              aria-live="polite"
            >
              <CheckCircle size={18} />

              <span>
                {successMessage}
              </span>
            </div>
          )}

          {/* =================================================
              REGISTER FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="register-form"
            noValidate
          >

            {/* =================================================
                FULL NAME
            ================================================= */}

            <div className="register-field">

              <label htmlFor="fullName">
                Full name
              </label>

              <div className="register-field-wrapper">

                <User
                  size={18}
                  className="register-field-icon"
                  aria-hidden="true"
                />

                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(
                      event.target.value
                    );
                    clearMessages();
                  }}
                  autoComplete="name"
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  required
                />

              </div>
            </div>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="register-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="register-field-wrapper">

                <Mail
                  size={18}
                  className="register-field-icon"
                  aria-hidden="true"
                />

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value
                    );
                    clearMessages();
                  }}
                  autoComplete="email"
                  inputMode="email"
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  required
                />

              </div>
            </div>

            {/* =================================================
                PHONE
            ================================================= */}

            <div className="register-field">

              <label htmlFor="phone">
                Phone number
              </label>

              <div className="register-field-wrapper">

                <Phone
                  size={18}
                  className="register-field-icon"
                  aria-hidden="true"
                />

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter your 10-digit phone number"
                  value={phone}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setPhone(value);
                    clearMessages();
                  }}
                  autoComplete="tel"
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  required
                />

              </div>
            </div>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="register-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="register-field-wrapper">

                <Lock
                  size={18}
                  className="register-field-icon"
                  aria-hidden="true"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );
                    clearMessages();
                  }}
                  autoComplete="new-password"
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  required
                />

                <button
                  type="button"
                  className="register-password-eye"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={
                    showPassword
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

            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <div className="register-field">

              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="register-field-wrapper">

                <Lock
                  size={18}
                  className="register-field-icon"
                  aria-hidden="true"
                />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value
                    );
                    clearMessages();
                  }}
                  autoComplete="new-password"
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  required
                />

                <button
                  type="button"
                  className="register-password-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={
                    showConfirmPassword
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

            {/* =================================================
                TERMS
            ================================================= */}

            <div className="register-terms-row">

              <label className="register-terms">

                <input
                  type="checkbox"
                  required
                  disabled={
                    loading ||
                    !!socialLoading
                  }
                />

                <span>
                  I agree to the Terms & Conditions
                </span>

              </label>

            </div>

            {/* =================================================
                CREATE ACCOUNT
            ================================================= */}

            <button
              type="submit"
              className="register-primary-button"
              disabled={
                loading ||
                !!socialLoading
              }
            >

              {loading ? (
                <>
                  <span
                    className="register-button-spinner"
                    aria-hidden="true"
                  ></span>

                  Creating account...
                </>
              ) : (
                <>
                  Create account

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </>
              )}

            </button>

          </form>

          {/* =================================================
              SOCIAL DIVIDER
          ================================================= */}

          <div className="register-divider">
            <span>
              OR CONTINUE WITH
            </span>
          </div>

          {/* =================================================
              GOOGLE + GITHUB
          ================================================= */}

          <div className="register-social-login">

            {/* =================================================
                GOOGLE
            ================================================= */}

            <button
              type="button"
              className="register-social-button"
              onClick={
                handleGoogleRegister
              }
              disabled={
                loading ||
                !!socialLoading
              }
            >

              {socialLoading === "google" ? (
                <span
                  className="register-social-spinner"
                  aria-hidden="true"
                ></span>
              ) : (
                <FcGoogle
                  size={21}
                  aria-hidden="true"
                />
              )}

              <span>
                {socialLoading === "google"
                  ? "Connecting..."
                  : "Google"}
              </span>

            </button>

            {/* =================================================
                GITHUB
            ================================================= */}

            <button
              type="button"
              className="register-social-button"
              onClick={
                handleGithubRegister
              }
              disabled={
                loading ||
                !!socialLoading
              }
            >

              {socialLoading === "github" ? (
                <span
                  className="register-social-spinner"
                  aria-hidden="true"
                ></span>
              ) : (
                <FaGithub
                  size={21}
                  className="register-github-icon"
                  aria-hidden="true"
                />
              )}

              <span>
                {socialLoading === "github"
                  ? "Connecting..."
                  : "GitHub"}
              </span>

            </button>

          </div>

          {/* =================================================
              LOGIN REDIRECT
          ================================================= */}

          <div className="register-login">

            <span>
              Already have an account?
            </span>

            <a href="/">
              Sign in
            </a>

          </div>

          {/* =================================================
              SECURITY
          ================================================= */}

          <div className="register-secure">

            <div className="register-secure-icon">
              <ShieldCheck size={17} />
            </div>

            <div>

              <strong>
                Secure registration
              </strong>

              <span>
                Your account information is protected.
              </span>

            </div>

          </div>

          {/* =================================================
              EMERGENCY
          ================================================= */}

          <div className="register-emergency">

            <div className="register-emergency-symbol">
              🚨
            </div>

            <div>

              <strong>
                Emergency?
              </strong>

              <span>
                After signing in, access SOS
                assistance and emergency resources.
              </span>

            </div>

          </div>

        </div>
      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div className="register-footer">

        <span>
          DisasterSafe
        </span>

        <span>
          •
        </span>

        <span>
          Emergency Assistance & Safety
        </span>

      </div>

    </div>
  );
}

export default Register;
