import { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import {
  FaGithub,
  FaGitlab,
} from "react-icons/fa";

import "./Login.css";


function Login() {

  // ==========================================
  // States
  // ==========================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);


  // ==========================================
  // Login
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setLoading(true);

    try {

      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );


      // Get backend response
      const data = await response.text();


      // ========================================
      // Login Successful
      // ========================================

      if (response.ok) {

        alert("Login successful!");

        console.log(
          "Logged in user:",
          data
        );


        // Save user information
        localStorage.setItem(
          "user",
          data
        );


        // Go to dashboard
        window.location.href =
          "/dashboard";

      }


      // ========================================
      // Login Failed
      // ========================================

      else {

        alert(data);

      }

    }

    catch (error) {

      console.error(
        "Login error:",
        error
      );

      alert(
        "Unable to connect to the backend. Please make sure the Spring Boot server is running."
      );

    }

    finally {

      setLoading(false);

    }

  };


  // ==========================================
  // Google Login
  // ==========================================

  const handleGoogleLogin = () => {

    window.location.href =
      "https://accounts.google.com/";

  };


  // ==========================================
  // GitHub Login
  // ==========================================

  const handleGithubLogin = () => {

    window.location.href =
      "https://github.com/login";

  };


  // ==========================================
  // GitLab Login
  // ==========================================

  const handleGitlabLogin = () => {

    window.location.href =
      "https://gitlab.com/users/sign_in";

  };


  // ==========================================
  // JSX
  // ==========================================

  return (

    <div className="login-page">

      <div className="login-card">


        {/* ====================================
            Logo
        ===================================== */}

        <div className="login-logo">

          <div className="logo-icon">
            ✦
          </div>

          <h1>
            Disaster Management
          </h1>

        </div>


        {/* ====================================
            Welcome
        ===================================== */}

        <div className="welcome-section">

          <h2>
            Welcome Back
          </h2>

          <p>
            Sign in to continue to your account
          </p>

        </div>


        {/* ====================================
            Login Form
        ===================================== */}

        <form onSubmit={handleSubmit}>


          {/* ==================================
              Email
          =================================== */}

          <div className="input-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="input-container">

              <Mail
                className="input-icon"
                size={18}
              />

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>

          </div>


          {/* ==================================
              Password
          =================================== */}

          <div className="input-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="input-container">

              <Lock
                className="input-icon"
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
                  setPassword(event.target.value)
                }
                required
              />


              {/* Password Toggle */}

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label="Show or hide password"
              >

                {showPassword ? (

                  <EyeOff size={18} />

                ) : (

                  <Eye size={18} />

                )}

              </button>

            </div>

          </div>


          {/* ==================================
              Remember + Forgot Password
          =================================== */}

          <div className="login-options">

            <label className="remember-me">

              <input
                type="checkbox"
              />

              <span>
                Remember me
              </span>

            </label>


            <a
              href="/forgot-password"
              className="forgot-link"
            >
              Forgot Password?
            </a>

          </div>


          {/* ==================================
              Login Button
          =================================== */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading ? (

              <span className="loading-content">

                <span className="spinner"></span>

                Signing in...

              </span>

            ) : (

              "Login"

            )}

          </button>

        </form>


        {/* ====================================
            Divider
        ===================================== */}

        <div className="divider">

          <span>
            OR
          </span>

        </div>


        {/* ====================================
            Social Login
        ===================================== */}

        <div className="social-section">

          <p>
            Continue with
          </p>


          <div className="social-buttons">


            {/* Google */}

            <button
              type="button"
              className="social-button"
              onClick={handleGoogleLogin}
              aria-label="Continue with Google"
              title="Continue with Google"
            >

              <FcGoogle size={25} />

            </button>


            {/* GitHub */}

            <button
              type="button"
              className="social-button"
              onClick={handleGithubLogin}
              aria-label="Continue with GitHub"
              title="Continue with GitHub"
            >

              <FaGithub size={25} />

            </button>


            {/* GitLab */}

            <button
              type="button"
              className="social-button"
              onClick={handleGitlabLogin}
              aria-label="Continue with GitLab"
              title="Continue with GitLab"
            >

              <FaGitlab size={25} />

            </button>

          </div>

        </div>


        {/* ====================================
            Register
        ===================================== */}

        <div className="register-section">

          <span>
            Don't have an account?
          </span>

          <a href="/register">
            Sign Up
          </a>

        </div>


        {/* ====================================
            Emergency Message
        ===================================== */}

        <div className="emergency-message">

          <span>
            🚨
          </span>

          <p>
            In an emergency, use the SOS feature
            to request immediate assistance.
          </p>

        </div>


      </div>

    </div>

  );
}


export default Login;