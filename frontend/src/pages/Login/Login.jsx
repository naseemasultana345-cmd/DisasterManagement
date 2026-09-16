import { useState } from "react";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Activity,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================================
  // NORMAL EMAIL/PASSWORD LOGIN
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://disastermanagement-gzg8.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.text();

      if (response.ok) {
        console.log("Logged in user:", data);

        localStorage.setItem("user", data);

        window.location.href = "/dashboard";
      } else {
        alert(data || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Unable to connect to the backend. Please make sure the Spring Boot server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // GOOGLE LOGIN
  // =========================================

  const handleGoogleLogin = () => {
    window.location.href =
      "https://disastermanagement-gzg8.onrender.com/oauth2/authorization/google";
  };

  // =========================================
  // GITHUB LOGIN
  // =========================================

  const handleGithubLogin = () => {
    window.location.href =
      "https://disastermanagement-gzg8.onrender.com/oauth2/authorization/github";
  };

  return (
    <div className="login-page">
      {/* =====================================
          BACKGROUND
      ====================================== */}
      <div className="login-background-glow glow-one"></div>
      <div className="login-background-glow glow-two"></div>
      <div className="login-grid"></div>

      {/* =====================================
          RIGHT LOGIN PANEL
      ====================================== */}
      <div className="login-panel">
        <div className="login-panel-inner">
          {/* Mobile Brand */}
          <div className="mobile-brand">
            <div className="mobile-logo">
              <Activity size={23} />
            </div>

            <div>
              <strong>
                Disaster<span>Safe</span>
              </strong>

              <small>Emergency Management</small>
            </div>
          </div>

          {/* Header */}
          <div className="login-header">
            <div className="welcome-label">WELCOME BACK</div>

            <h2>Sign in to your account</h2>

            <p>Continue to your emergency safety dashboard.</p>
          </div>

          {/* =================================
              LOGIN FORM
          ================================== */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="field">
              <label htmlFor="email">Email address</label>

              <div className="field-wrapper">
                <Mail size={18} className="field-icon" />

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>

                <a href="/forgot-password" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <div className="field-wrapper">
                <Lock size={18} className="field-icon" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="remember-row">
              <label className="remember">
                <input type="checkbox" />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Login */}
            <button
              type="submit"
              className="primary-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* =================================
              DIVIDER
          ================================== */}
          <div className="login-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          {/* =================================
              SOCIAL LOGIN
          ================================== */}
          <div className="social-login">
            <button
              type="button"
              className="social-login-button"
              onClick={handleGoogleLogin}
            >
              <FcGoogle size={21} />
              <span>Google</span>
            </button>

            <button
              type="button"
              className="social-login-button"
              onClick={handleGithubLogin}
            >
              <FaGithub size={21} className="github-icon" />
              <span>GitHub</span>
            </button>
          </div>

          {/* Register */}
          <div className="create-account">
            <span>Don't have an account?</span>
            <a href="/register">Create one</a>
          </div>

          {/* Security */}
          <div className="secure-login">
            <div className="secure-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <strong>Secure sign in</strong>
              <span>Your account information is protected.</span>
            </div>
          </div>

          {/* Emergency */}
          <div className="login-emergency">
            <div className="emergency-symbol">🚨</div>

            <div>
              <strong>Emergency?</strong>
              <span>
                Sign in to access SOS assistance and emergency resources.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <span>DisasterSafe</span>
        <span>•</span>
        <span>Emergency Assistance & Safety</span>
      </div>
    </div>
  );
}

export default Login;