import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Create a context for auth
const AuthContext = createContext();

// Provide the context to the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Handle initial loading

  // Fetch user data on mount (get current user)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
          withCredentials: true, // Make sure cookies are sent
        });
        setUser(res.data.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Logout function
  const logout = async () => {
    await axios.get(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      withCredentials: true, // Send cookies for logout
    });
    setUser(null); // Clear the user state on logout
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth context
export const useAuth = () => useContext(AuthContext);
