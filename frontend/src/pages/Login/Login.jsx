
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

// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com/api";

const OAUTH_BASE_URL =
  "https://disastermanagement-gzg8.onrender.com";

const OAUTH_CALLBACK_URL =
  "com.disastermanagement.app://oauth2redirect";

// =========================================================
// LOGIN COMPONENT
// =========================================================

function Login() {
  const navigate = useNavigate();

  // =======================================================
  // FORM STATE
  // =======================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // =======================================================
  // LOADING STATE
  // =======================================================

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");

  // =======================================================
  // MESSAGE STATE
  // =======================================================

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =======================================================
  // LOAD REMEMBERED EMAIL
  // =======================================================

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // =======================================================
  // ANDROID OAUTH CALLBACK
  // =======================================================

  useEffect(() => {
    let listener;

    const setupOAuthListener = async () => {
      // Only set up the native deep-link listener
      // when running inside the Capacitor Android app.
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      listener = await App.addListener(
        "appUrlOpen",
        async ({ url }) => {
          console.log("OAuth callback URL:", url);

          // Only handle our Android deep-link.
          if (
            !url ||
            !url.startsWith(OAUTH_CALLBACK_URL)
          ) {
            return;
          }

          try {
            // Close browser/custom tab.
            try {
              await Browser.close();
            } catch (browserError) {
              console.log(
                "Browser close skipped:",
                browserError
              );
            }

            const callbackUrl = new URL(url);

            const code =
              callbackUrl.searchParams.get("code");

            const oauthError =
              callbackUrl.searchParams.get("error");

            // =============================================
            // OAUTH ERROR
            // =============================================

            if (oauthError) {
              setSocialLoading("");
              setErrorMessage(
                decodeURIComponent(oauthError)
              );
              return;
            }

            // =============================================
            // NO CODE
            // =============================================

            if (!code) {
              setSocialLoading("");
              setErrorMessage(
                "OAuth login failed. No authorization code received."
              );
              return;
            }

            // =============================================
            // EXCHANGE CODE WITH BACKEND
            // =============================================

            setSocialLoading("oauth");

            const response = await fetch(
              `${OAUTH_BASE_URL}/api/auth/mobile/oauth/exchange`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  code,
                }),
              }
            );

            let data;

            try {
              data = await response.json();
            } catch {
              data = null;
            }

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  "OAuth login failed."
              );
            }

            // =============================================
            // STORE OAUTH USER
            // =============================================

            const oauthUser = {
              email: data?.email || "",
              fullName: data?.name || "",
              name: data?.name || "",
              picture: data?.picture || "",
            };

            localStorage.setItem(
              "user",
              JSON.stringify(oauthUser)
            );

            sessionStorage.setItem(
              "user",
              JSON.stringify(oauthUser)
            );

            // =============================================
            // SUCCESS
            // =============================================

            setErrorMessage("");
            setSuccessMessage(
              "Login successful. Redirecting..."
            );

            setSocialLoading("");

            navigate("/dashboard");
          } catch (error) {
            console.error(
              "OAuth callback error:",
              error
            );

            setSocialLoading("");

            setErrorMessage(
              error?.message ||
                "OAuth login failed. Please try again."
            );
          }
        }
      );
    };

    setupOAuthListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);

  // =======================================================
  // NORMAL LOGIN
  // =======================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    // =====================================================
    // EMAIL VALIDATION
    // =====================================================

    if (!trimmedEmail) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    // =====================================================
    // PASSWORD VALIDATION
    // =====================================================

    if (!password) {
      setErrorMessage(
        "Please enter your password."
      );
      return;
    }

    // =====================================================
    // REMEMBER EMAIL
    // =====================================================

    if (rememberMe) {
      localStorage.setItem(
        "rememberedEmail",
        trimmedEmail
      );
    } else {
      localStorage.removeItem(
        "rememberedEmail"
      );
    }

    // =====================================================
    // START LOGIN
    // =====================================================

    setLoading(true);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const loginUrl =
        `${API_BASE_URL}/auth/login`;

      const response = await fetch(
        loginUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            password,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      // ===================================================
      // LOGIN FAILED
      // ===================================================

      if (!response.ok) {
        const message =
          typeof data === "string"
            ? data
            : data?.message ||
              "Invalid email or password.";

        throw new Error(message);
      }

      // ===================================================
      // LOGIN SUCCESS
      // ===================================================

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

      // ===================================================
      // GO TO DASHBOARD
      // ===================================================

      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (error) {
      clearTimeout(timeoutId);

      console.error(
        "Login error:",
        error
      );

      if (error?.name === "AbortError") {
        setErrorMessage(
          "Login request timed out. Please check your network connection and try again."
        );
      } else {
        setErrorMessage(
          error?.message ||
            "Unable to connect to the backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // GOOGLE LOGIN
  // =======================================================

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setSocialLoading("google");

    try {
      // ===================================================
      // ANDROID
      // ===================================================

      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url:
            `${OAUTH_BASE_URL}/oauth2/authorization/google`,
        });

        return;
      }

      // ===================================================
      // WEB / FIREFOX
      // ===================================================

      window.location.href =
        `${OAUTH_BASE_URL}/api/auth/web/oauth/google`;
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setSocialLoading("");

      setErrorMessage(
        "Unable to start Google login. Please try again."
      );
    }
  };

  // =======================================================
  // GITHUB LOGIN
  // =======================================================

  const handleGithubLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setSocialLoading("github");

    try {
      // ===================================================
      // ANDROID
      // ===================================================

      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url:
            `${OAUTH_BASE_URL}/oauth2/authorization/github`,
        });

        return;
      }

      // ===================================================
      // WEB / FIREFOX
      // ===================================================

      window.location.href =
        `${OAUTH_BASE_URL}/api/auth/web/oauth/github`;
    } catch (error) {
      console.error(
        "GitHub login error:",
        error
      );

      setSocialLoading("");

      setErrorMessage(
        "Unable to start GitHub login. Please try again."
      );
    }
  };

  // =======================================================
  // FORGOT PASSWORD
  // =======================================================

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // =======================================================
  // REGISTER
  // =======================================================

  const handleRegister = () => {
    navigate("/register");
  };

  // =======================================================
  // JSX
  // =======================================================

  return (
    <div className="login-page">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="login-background-glow glow-one"></div>
      <div className="login-background-glow glow-two"></div>
      <div className="login-grid"></div>

      {/* =================================================
          LOGIN CONTENT
      ================================================= */}

      <div className="login-content">

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="login-brand">

          <div className="brand-logo">
            <ShieldCheck
              size={27}
              strokeWidth={2.4}
            />
          </div>

          <div className="brand-info">
            <strong>
              Disaster<span>Safe</span>
            </strong>

            <small>
              Emergency Management
            </small>
          </div>

        </div>

        {/* =================================================
            LOGIN HEADER
        ================================================= */}

        <div className="login-header">

          <div className="welcome-label">
            <Activity size={13} />

            <span>
              SECURE ACCESS
            </span>
          </div>

          <h1>
            Welcome Back
          </h1>

          <p>
            Sign in to access your
            emergency dashboard
          </p>

        </div>

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {errorMessage && (
          <div className="login-message login-error">

            <AlertCircle size={17} />

            <span>
              {errorMessage}
            </span>

          </div>
        )}

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (
          <div className="login-message login-success">

            <CheckCircle size={17} />

            <span>
              {successMessage}
            </span>

          </div>
        )}

        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="field">

            <label htmlFor="email">
              Email Address
            </label>

            <div className="field-wrapper">

              <Mail
                className="field-icon"
                size={18}
              />

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                disabled={
                  loading ||
                  socialLoading !== ""
                }
              />

            </div>

          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="field">

            <div className="field-label-row">

              <label htmlFor="password">
                Password
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={
                  handleForgotPassword
                }
                disabled={
                  loading ||
                  socialLoading !== ""
                }
              >
                Forgot Password?
              </button>

            </div>

            <div className="field-wrapper">

              <Lock
                className="field-icon"
                size={18}
              />

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
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                disabled={
                  loading ||
                  socialLoading !== ""
                }
              />

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={
                  loading ||
                  socialLoading !== ""
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

          {/* =================================================
              REMEMBER ME
          ================================================= */}

          <div className="remember-row">

            <label className="remember">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
                disabled={
                  loading ||
                  socialLoading !== ""
                }
              />

              <span>
                Remember me
              </span>

            </label>

          </div>

          {/* =================================================
              SIGN IN BUTTON
          ================================================= */}

          <button
            type="submit"
            className="primary-login-button"
            disabled={
              loading ||
              socialLoading !== ""
            }
          >

            {loading ? (
              <>
                <span className="button-spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}

          </button>

        </form>

        {/* =================================================
            DIVIDER
        ================================================= */}

        <div className="login-divider">

          <span></span>

          <p>
            OR CONTINUE WITH
          </p>

          <span></span>

        </div>

        {/* =================================================
            SOCIAL LOGIN
        ================================================= */}

        <div className="social-login">

          {/* =================================================
              GOOGLE
          ================================================= */}

          <button
            type="button"
            className="social-login-button"
            onClick={
              handleGoogleLogin
            }
            disabled={
              loading ||
              socialLoading !== ""
            }
          >

            {socialLoading === "google" ? (
              <span className="social-spinner"></span>
            ) : (
              <FcGoogle size={20} />
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
            className="social-login-button"
            onClick={
              handleGithubLogin
            }
            disabled={
              loading ||
              socialLoading !== ""
            }
          >

            {socialLoading === "github" ? (
              <span className="social-spinner"></span>
            ) : (
              <FaGithub
                className="github-icon"
                size={20}
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
            CREATE ACCOUNT
        ================================================= */}

        <div className="create-account">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={
              handleRegister
            }
            disabled={
              loading ||
              socialLoading !== ""
            }
          >
            Create Account
          </button>

        </div>

        {/* =================================================
            SECURE LOGIN
        ================================================= */}

        <div className="secure-login">

          <div className="secure-icon">
            <ShieldCheck size={16} />
          </div>

          <div>

            <strong>
              Secure Login
            </strong>

            <span>
              Your information is protected
            </span>

          </div>

        </div>

        {/* =================================================
            EMERGENCY
        ================================================= */}

        <div className="login-emergency">

          <div className="emergency-symbol">
            !
          </div>

          <div>

            <strong>
              Emergency Assistance
            </strong>

            <span>
              For immediate emergencies,
              call <strong>112</strong>
            </span>

          </div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="login-footer">

          <span>
            © {new Date().getFullYear()} DisasterSafe
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