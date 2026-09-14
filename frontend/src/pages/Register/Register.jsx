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
} from "lucide-react";

import "./Register.css";

function Register() {
  // =========================
  // Form States
  // =========================

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // Other States
  // =========================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // Register User
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: fullName,
            email: email,
            phone: phone,
            password: password,
          }),
        }
      );

      const data = await response.text();

      if (response.ok) {
        alert("Registration successful!");

        console.log("Registered user:", data);

        // Clear form
        setFullName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");

        // Go to Login page
        window.location.href = "/";
      } else {
        alert(data || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);

      alert(
        "Unable to connect to the backend. Please make sure the Spring Boot server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* Background */}
      <div className="register-background-glow glow-one"></div>
      <div className="register-background-glow glow-two"></div>
      <div className="register-grid"></div>

      {/* =========================
          REGISTER PANEL
      ========================= */}

      <div className="register-panel">

        <div className="register-panel-inner">

          {/* =========================
              BRAND
          ========================= */}

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

          {/* =========================
              HEADER
          ========================= */}

          <div className="register-header">

            <div className="register-welcome-label">
              GET STARTED
            </div>

            <h2>
              Create your account
            </h2>

            <p>
              Register to stay prepared, connected
              and protected.
            </p>

          </div>

          {/* =========================
              REGISTER FORM
          ========================= */}

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >

            {/* Full Name */}

            <div className="register-field">

              <label htmlFor="fullName">
                Full name
              </label>

              <div className="register-field-wrapper">

                <User
                  size={18}
                  className="register-field-icon"
                />

                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  autoComplete="name"
                  required
                />

              </div>

            </div>

            {/* Email */}

            <div className="register-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="register-field-wrapper">

                <Mail
                  size={18}
                  className="register-field-icon"
                />

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* Phone */}

            <div className="register-field">

              <label htmlFor="phone">
                Phone number
              </label>

              <div className="register-field-wrapper">

                <Phone
                  size={18}
                  className="register-field-icon"
                />

                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  autoComplete="tel"
                  required
                />

              </div>

            </div>

            {/* Password */}

            <div className="register-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="register-field-wrapper">

                <Lock
                  size={18}
                  className="register-field-icon"
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
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-eye"
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

            <div className="register-field">

              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="register-field-wrapper">

                <Lock
                  size={18}
                  className="register-field-icon"
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
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-password-eye"
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

            {/* Terms */}

            <div className="register-terms-row">

              <label className="register-terms">

                <input
                  type="checkbox"
                  required
                />

                <span>
                  I agree to the Terms & Conditions
                </span>

              </label>

            </div>

            {/* Create Account */}

            <button
              type="submit"
              className="register-primary-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="register-button-spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* =========================
              LOGIN REDIRECT
          ========================= */}

          <div className="register-login">

            <span>
              Already have an account?
            </span>

            <a href="/">
              Sign in
            </a>

          </div>

          {/* =========================
              SECURITY MESSAGE
          ========================= */}

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

          {/* =========================
              EMERGENCY MESSAGE
          ========================= */}

          <div className="register-emergency">

            <div className="register-emergency-symbol">
              🚨
            </div>

            <div>

              <strong>
                Emergency?
              </strong>

              <span>
                After signing in, access SOS assistance
                and emergency resources.
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =========================
          FOOTER
      ========================= */}

      <div className="register-footer">

        <span>
          DisasterSafe
        </span>

        <span>•</span>

        <span>
          Emergency Assistance & Safety
        </span>

      </div>

    </div>
  );
}

export default Register;