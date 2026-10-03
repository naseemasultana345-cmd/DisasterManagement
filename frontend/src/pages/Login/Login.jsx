
import { useEffect, useState } from "react";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import { useNavigate } from "react-router-dom";

import "./Login.css";

const API_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com/api";

const OAUTH_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com";

const OAUTH_CALLBACK_URL =
  "com.disastermanagement.app://oauth2redirect";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    let listener;

    const setupAppListener = async () => {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      listener = await App.addListener(
        "appUrlOpen",
        async ({ url }) => {
          try {
            if (
              !url ||
              !url.startsWith(OAUTH_CALLBACK_URL)
            ) {
              return;
            }

            const queryString = url.includes("?")
              ? url.split("?")[1]
              : "";

            const params = new URLSearchParams(queryString);

            const code = params.get("code");
            const error = params.get("error");

            await Browser.close();

            if (error) {
              setSocialLoading("");
              setErrorMessage(
                `Social login failed: ${error}`
              );
              return;
            }

            if (!code) {
              setSocialLoading("");
              setErrorMessage(
                "Social login did not return an authorization code."
              );
              return;
            }

            setSocialLoading("social");

            const response = await fetch(
              `${OAUTH_BASE_URL}/api/auth/mobile/oauth/exchange`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  code,
                  redirectUri: OAUTH_CALLBACK_URL,
                }),
              }
            );

            let data = null;

            try {
              data = await response.json();
            } catch {
              data = null;
            }

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  "Unable to complete social login."
              );
            }

            localStorage.setItem(
              "user",
              JSON.stringify(data)
            );

            sessionStorage.setItem(
              "user",
              JSON.stringify(data)
            );

            setSuccessMessage(
              "Login successful. Redirecting..."
            );

            setTimeout(() => {
              navigate("/dashboard");
            }, 300);
          } catch (error) {
            console.error(
              "OAuth callback error:",
              error
            );

            setErrorMessage(
              error?.message ||
                "Unable to complete social login."
            );
          } finally {
            setSocialLoading("");
          }
        }
      );
    };

    setupAppListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const loginUrl =
        `${API_BASE_URL}/auth/login`;

      console.log("Login request:", loginUrl);

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
        signal: controller.signal,
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          typeof data === "string"
            ? data
            : data?.message ||
              "Invalid email or password.";

        throw new Error(message);
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      sessionStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      if (rememberMe) {
        localStorage.setItem(
          "rememberedEmail",
          trimmedEmail
        );
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setErrorMessage("");

      setSuccessMessage(
        "Login successful. Redirecting..."
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (error) {
      console.error("Login error:", error);

      if (error?.name === "AbortError") {
        setErrorMessage(
          "The server is taking longer than expected to respond. Please try again."
        );
      } else {
        setErrorMessage(
          error?.message ||
            "Unable to connect to the backend."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setSocialLoading("google");

    try {
      const googleUrl =
        `${OAUTH_BASE_URL}/api/auth/web/oauth/google`;

      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: googleUrl,
        });
      } else {
        window.location.href = googleUrl;
      }
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setSocialLoading("");

      setErrorMessage(
        error?.message ||
          "Unable to start Google login."
      );
    }
  };

  const handleGithubLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setSocialLoading("github");

    try {
      const githubUrl =
        `${OAUTH_BASE_URL}/api/auth/web/oauth/github`;

      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: githubUrl,
        });
      } else {
        window.location.href = githubUrl;
      }
    } catch (error) {
      console.error(
        "GitHub login error:",
        error
      );

      setSocialLoading("");

      setErrorMessage(
        error?.message ||
          "Unable to start GitHub login."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-background-shape shape-one"></div>
        <div className="login-background-shape shape-two"></div>
        <div className="login-background-shape shape-three"></div>
      </div>

      <div className="login-container">
        <div className="login-card">

          <div className="login-brand">
            <div className="brand-icon">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h1>DisasterSafe</h1>
              <p>Emergency Management</p>
            </div>
          </div>

          <div className="login-header">
            <div className="status-indicator">
              <Activity size={16} />
              <span>
                Emergency System Online
              </span>
            </div>

            <h2>Welcome Back</h2>

            <p>
              Sign in to access your disaster
              management dashboard.
            </p>
          </div>

          {errorMessage && (
            <div className="login-message error-message">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="login-message success-message">
              <CheckCircle size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <div className="form-group">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">
                <Lock size={19} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(
                      event.target.checked
                    )
                  }
                  disabled={loading}
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  navigate("/forgot-password")
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="social-login-buttons">
            <button
              type="button"
              className="social-login-button google-button"
              onClick={handleGoogleLogin}
              disabled={
                loading ||
                socialLoading === "google" ||
                socialLoading === "github" ||
                socialLoading === "social"
              }
            >
              {socialLoading === "google" ||
              socialLoading === "social" ? (
                <span className="button-spinner"></span>
              ) : (
                <FcGoogle size={21} />
              )}

              <span>
                {socialLoading === "google"
                  ? "Connecting..."
                  : "Continue with Google"}
              </span>
            </button>

            <button
              type="button"
              className="social-login-button github-button"
              onClick={handleGithubLogin}
              disabled={
                loading ||
                socialLoading === "google" ||
                socialLoading === "github" ||
                socialLoading === "social"
              }
            >
              {socialLoading === "github" ||
              socialLoading === "social" ? (
                <span className="button-spinner"></span>
              ) : (
                <FaGithub size={21} />
              )}

              <span>
                {socialLoading === "github"
                  ? "Connecting..."
                  : "Continue with GitHub"}
              </span>
            </button>
          </div>

          <div className="register-section">
            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
            >
              Create Account
            </button>
          </div>

          <div className="security-note">
            <ShieldCheck size={15} />

            <span>
              Your information is securely
              protected.
            </span>
          </div>

        </div>

        <div className="login-footer">
          <span>© 2026 DisasterSafe</span>

          <span className="footer-separator">
            •
          </span>

          <span>
            Emergency Management System
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;
