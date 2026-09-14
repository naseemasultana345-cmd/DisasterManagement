import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaGitlab } from "react-icons/fa";

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
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);


  // =========================
  // Register User
  // =========================

  const handleSubmit = async (event) => {

    event.preventDefault();

    // Check password
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


      // Get response
      const data = await response.text();


      // =========================
      // Successful Registration
      // =========================

      if (response.ok) {

        alert("Registration successful!");

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


        // Go to Login page

        window.location.href = "/";

      }


      // =========================
      // Registration Failed
      // =========================

      else {

        alert(data);

      }

    }

    catch (error) {

      console.error(
        "Registration error:",
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


  // =========================
  // Google
  // =========================

  const handleGoogleRegister = () => {

    window.location.href =
      "https://accounts.google.com/";

  };


  // =========================
  // GitHub
  // =========================

  const handleGithubRegister = () => {

    window.location.href =
      "https://github.com/login";

  };


  // =========================
  // GitLab
  // =========================

  const handleGitlabRegister = () => {

    window.location.href =
      "https://gitlab.com/users/sign_in";

  };


  // =========================
  // JSX
  // =========================

  return (

    <div className="register-page">

      <div className="register-card">


        {/* =====================================
            Logo
        ====================================== */}

        <div className="register-logo">

          <div className="register-logo-icon">
            ✦
          </div>

          <h1>
            Disaster Management
          </h1>

        </div>


        {/* =====================================
            Welcome
        ====================================== */}

        <div className="register-welcome">

          <h2>
            Create Account
          </h2>

          <p>
            Join us to stay prepared and connected
          </p>

        </div>


        {/* =====================================
            Register Form
        ====================================== */}

        <form onSubmit={handleSubmit}>


          {/* =====================================
              Full Name
          ====================================== */}

          <div className="register-input-group">

            <label htmlFor="fullName">
              Full Name
            </label>

            <div className="register-input-container">

              <User
                className="register-input-icon"
                size={18}
              />

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                required
              />

            </div>

          </div>


          {/* =====================================
              Email
          ====================================== */}

          <div className="register-input-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="register-input-container">

              <Mail
                className="register-input-icon"
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


          {/* =====================================
              Phone
          ====================================== */}

          <div className="register-input-group">

            <label htmlFor="phone">
              Phone Number
            </label>

            <div className="register-input-container">

              <Phone
                className="register-input-icon"
                size={18}
              />

              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                required
              />

            </div>

          </div>


          {/* =====================================
              Password
          ====================================== */}

          <div className="register-input-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="register-input-container">

              <Lock
                className="register-input-icon"
                size={18}
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
                required
              />


              {/* Show / Hide Password */}

              <button
                type="button"
                className="register-password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
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


          {/* =====================================
              Confirm Password
          ====================================== */}

          <div className="register-input-group">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div className="register-input-container">

              <Lock
                className="register-input-icon"
                size={18}
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
                required
              />


              {/* Show / Hide Confirm Password */}

              <button
                type="button"
                className="register-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                aria-label="Show or hide confirm password"
              >

                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}

              </button>

            </div>

          </div>


          {/* =====================================
              Terms & Conditions
          ====================================== */}

          <div className="terms-section">

            <label className="terms-label">

              <input
                type="checkbox"
                required
              />

              <span>
                I agree to the Terms & Conditions
              </span>

            </label>

          </div>


          {/* =====================================
              Register Button
          ====================================== */}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >

            {loading ? (

              <span className="register-loading">

                <span className="register-spinner"></span>

                Creating Account...

              </span>

            ) : (

              "Create Account"

            )}

          </button>

        </form>


        {/* =====================================
            Divider
        ====================================== */}

        <div className="register-divider">

          <span>
            OR
          </span>

        </div>


        {/* =====================================
            Social Registration
        ====================================== */}

        <div className="register-social-section">

          <p>
            Sign up with
          </p>


          <div className="register-social-buttons">


            {/* =================================
                Google
            ================================== */}

            <button
              type="button"
              className="register-social-button"
              onClick={handleGoogleRegister}
              title="Sign up with Google"
              aria-label="Sign up with Google"
            >

              <FcGoogle size={24} />

            </button>


            {/* =================================
                GitHub
            ================================== */}

            <button
              type="button"
              className="register-social-button"
              onClick={handleGithubRegister}
              title="Sign up with GitHub"
              aria-label="Sign up with GitHub"
            >

              <FaGithub size={24} />

            </button>


            {/* =================================
                GitLab
            ================================== */}

            <button
              type="button"
              className="register-social-button"
              onClick={handleGitlabRegister}
              title="Sign up with GitLab"
              aria-label="Sign up with GitLab"
            >

              <FaGitlab size={24} />

            </button>

          </div>

        </div>


        {/* =====================================
            Login Redirect
        ====================================== */}

        <div className="login-redirect">

          <span>
            Already have an account?
          </span>

          <a href="/">
            Sign In
          </a>

        </div>


        {/* =====================================
            Emergency Message
        ====================================== */}

        <div className="register-emergency-message">

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

export default Register;