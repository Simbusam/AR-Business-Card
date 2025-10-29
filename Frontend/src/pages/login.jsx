import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';
import API from "../services/api";
import HomePage from './homepage';
import { themeColors } from "../config/theme";
import { FaTimes } from 'react-icons/fa'; // Import cross icon from react-icons

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, data } = response.data;
      dispatch(setUser({ user: data, token }));

      localStorage.setItem("token", token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("data", JSON.stringify(data));

      if (data.role === "admin") {
        navigate("/admindash");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      console.error("Login error:", err);
    }
  };

  // const handleGoogleSignIn = () => {
  //   console.log("Google Sign-In clicked");
  // };

  // const handleAppleSignIn = () => {
  //   console.log("Apple Sign-In clicked");
  // };

  return (
    <div className="relative min-h-screen p-4 sm:p-6 flex items-center justify-center" style={{ backgroundColor: themeColors.darkPurple }}>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <HomePage />
      </div>
      <div className="absolute inset-0 z-0 bg-black opacity-60 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-lg shadow-2xl rounded-xl p-6 sm:p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-6">
          <Link
            to="/"
            className="text-3xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(45deg, #00C2CB, #6C5CE7)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            WEBAR
          </Link>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-center mb-6" 
            style={{
              background: 'linear-gradient(45deg,  #2B1A5D, #00D2CB)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.2)',
            }}>Login to Your Account !</h1>

        {error && (
          <div className="mb-4 text-red-400 text-center font-medium">{error}</div>
        )}

        <form className="mb-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: themeColors.textLight }}>
              Email
            </label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="bg-white/20 border border-white/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-white/70"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: themeColors.textLight }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="bg-white/20 border border-white/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-white/70"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm" style={{ color: themeColors.textLight }}>
              Remember Me
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 font-semibold rounded-lg hover:text-blue-400 transition "
            style={{ backgroundColor: '#5a4ad7', color: themeColors.textLight,  transition: 'background-color 0.3s ease'}}
                         onMouseEnter={(e) => e.target.style.backgroundColor = '#7a4ad7'} // Darker shade on hover
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#5a4ad7'} 
                       
                      
          >
            Login
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: themeColors.textLight }}>
            Don't have an account?{" "}
            <Link to="/register" className="text-cyan-400 hover:underline transition">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 text-white text-xl font-bold hover:text-blue-400 transition"
          title="Close"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default Login;
