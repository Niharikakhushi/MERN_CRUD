import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api.js";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Basic validation
    if (!email || !password) {
      setMessage("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setAuthToken(token);

      // Optional: Clear form after success
      setEmail("");
      setPassword("");
      navigate("/dashboard");

    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {/* LEFT SIDE */}
      <div className="left-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Login</h2>

          {message && <p className="error-text">{message}</p>}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Enter your email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
          />

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="reset-text">Reset</p>
          <p className="switch-text" onClick={() => navigate("/signup")}>
            Create an account
          </p>
        </form>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-section"></div>
    </div>
  );
}

export default Login;
