import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice'; // Adjust this path if needed
import { themeColors } from '../../config/theme';

const UserNavbar = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear localStorage (or sessionStorage)
        localStorage.removeItem('token');  // Remove token if stored
        // Dispatch logout to Redux
        dispatch(logout());
        // Redirect to login or homepage
        navigate('/login');
    };

    return (
        <>
            <header
                className="flex justify-between items-center px-4 md:px-10 py-4 shadow-md"
                style={{ backgroundColor: themeColors.darkPurple }}
            >
                {/* Left: Logo + Navigation */}
                <div className="flex items-center gap-6 md:gap-12">
                    <Link
                        to="/dashboard"
                        className="text-2xl md:text-3xl font-bold tracking-tight"
                        style={{
                            background: 'linear-gradient(45deg, #00C2CB, #6C5CE7)',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        WEBAR
                    </Link>

                    <nav className="hidden md:flex items-center gap-10 ml-6 md:ml-12 text-lg font-medium">
                        <Link
                            to="/user/projects"
                            className="text-[#E0E0E0] hover:text-cyan-300 transition-colors duration-200"
                        >
                            My Projects
                        </Link>
                        <Link
                            to="/user/media"
                            className="text-[#E0E0E0] hover:text-indigo-300 transition-colors duration-200"
                        >
                            Media
                        </Link>
                    </nav>
                </div>

                {/* Right: Panel Info + Settings + Profile (hidden on mobile) */}
                <div className="hidden md:flex items-center gap-8">
                    <span
                        className="text-xl font-semibold tracking-wide"
                        style={{
                            background: 'linear-gradient(45deg, #00C2CB, #6C5CE7)',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        USER PANEL
                    </span>

                    <Link
                        to="/user/settings"
                        className="text-[#E0E0E0] text-lg font-medium hover:text-purple-300 transition-colors duration-200"
                    >
                        Settings
                    </Link>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: themeColors.accentPink }}
                            >
                                <span className="text-white font-semibold">A</span>
                            </div>
                        </button>

                        {isProfileOpen && (
                            <div
                                className="absolute right-0 top-12 w-48 py-2 rounded-lg shadow-xl z-10"
                                style={{
                                    backgroundColor: themeColors.primaryDark,
                                    border: `1px solid ${themeColors.primaryPurple}`,
                                }}
                            >
                                <Link
                                    to="/user/settings"
                                    className="block px-4 py-3 text-left hover:bg-purple-900/60 text-white border-b border-purple-700"
                                >
                                    Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 text-left hover:bg-red-800/50 text-white"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden px-3 py-2 rounded border"
                    style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}
                    onClick={() => setIsProfileOpen((v) => !v)}
                >
                    Menu
                </button>
            </header>

            {/* Mobile dropdown menu */}
            {isProfileOpen && (
                <div className="md:hidden px-4 py-3 border-b" style={{ borderColor: themeColors.primaryPurple + '40', backgroundColor: themeColors.darkPurple }}>
                    <div className="flex flex-col gap-3">
                        <Link to="/user/projects" className="text-[#E0E0E0]">My Projects</Link>
                        <Link to="/user/media" className="text-[#E0E0E0]">Media</Link>
                        <Link to="/user/settings" className="text-[#E0E0E0]">Settings</Link>
                        <button onClick={handleLogout} className="text-left text-[#E0E0E0]">Logout</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserNavbar;
