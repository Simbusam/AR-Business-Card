import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import HomePage from './homepage';
import { themeColors } from "../config/theme";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    workEmail: "",
    password: "",
    passwordConfirmation: "",
    agreeToPolicies: false,
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

    if (!formData.agreeToPolicies) {
      setError("You must agree to the Privacy Policy and Terms of Service!");
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError("Passwords do not match!");
      return;
    }

    try {
      await API.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.workEmail,
        password: formData.password,
        confirmPassword: formData.passwordConfirmation,
        agreedToPrivacyPolicy: formData.agreeToPolicies,
      });

      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div
      className="relative min-h-screen p-4 sm:p-6 flex items-center justify-center"
      style={{ backgroundColor: themeColors.darkPurple }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <HomePage />
      </div>
      <div className="absolute inset-0 z-0 bg-black opacity-60 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-lg shadow-2xl rounded-xl p-6 sm:p-8 w-full max-w-md border border-white/20">

        {/* Cancel Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-blue-400 transition"
          title="Close"
        >
          &times;
        </button>

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
              background: 'linear-gradient(45deg,  #00D2CB, #2B1A5D )',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0)',
            }}>
          Create Your Account !!
        </h1>

        {error && (
          <div className="mb-4 text-red-400 text-center font-medium">{error}</div>
        )}

        <form className="mb-6" onSubmit={handleSubmit}>
          {["firstName", "lastName", "workEmail"].map((field) => (
            <div key={field} className="mb-4">
              <label htmlFor={field} className="block text-sm font-medium mb-1" style={{ color: themeColors.textLight }}>
                {field === "workEmail" ? "Work Email" : field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type={field === "workEmail" ? "email" : "text"}
                id={field}
                name={field}
                placeholder={`Enter your ${field === "workEmail" ? "work email" : field}`}
                value={formData[field]}
                onChange={handleInputChange}
                required
                className="bg-white/20 border border-white/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-white/70"
              />
            </div>
          ))}

          {["password", "passwordConfirmation"].map((field) => (
            <div key={field} className="mb-4">
              <label htmlFor={field} className="block text-sm font-medium mb-1" style={{ color: themeColors.textLight }}>
                {field === "passwordConfirmation" ? "Confirm Password" : "Password"}
              </label>
              <input
                type="password"
                id={field}
                name={field}
                placeholder={field === "passwordConfirmation" ? "Confirm your password" : "Enter your password"}
                value={formData[field]}
                onChange={handleInputChange}
                required
                className="bg-white/20 border border-white/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-white/70"
              />
            </div>
          ))}

          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="agreeToPolicies"
              name="agreeToPolicies"
              checked={formData.agreeToPolicies}
              onChange={handleInputChange}
              className="h-4 w-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500 mt-1"
            />
            <label htmlFor="agreeToPolicies" className="ml-2 text-sm" style={{ color: themeColors.textLight }}>
              I agree to the <a href="/privacy-policy" className="text-cyan-400 hover:underline">Privacy Policy</a> and <a href="/terms-of-service" className="text-cyan-400 hover:underline">Terms of Service</a>.
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 font-semibold rounded-lg 
              text-white"
             style={{ backgroundColor: '#5a4ad7', color: themeColors.textLight,  transition: 'background-color 0.3s ease'}}
             onMouseEnter={(e) => e.target.style.backgroundColor = '#7a4ad7'} // Darker shade on hover
            onMouseLeave={(e) => e.target.style.backgroundColor = '#5a4ad7'} 
           
          >
            Sign Up
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm" style={{ color: themeColors.textLight }}>
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:underline transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
