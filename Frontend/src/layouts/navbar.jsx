import React from 'react';
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className=" text-white">
      <div className="container mx-auto flex justify-between items-center px-4 py-4">
        {/* Logo */}        
        <Link to="/">
      <h1 className="text-xl font-bold cursor-pointer">NextXR</h1>
    </Link>


        {/* Navigation Links */}
        <nav>
          <ul className="flex flex-wrap space-x-4 text-sm md:text-base">
            <li>
              <Link to="/" className="hover:underline cursor-pointer">
                Home
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:underline cursor-pointer">
                Services
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:underline cursor-pointer">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline cursor-pointer">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:underline cursor-pointer">
                Sign Up
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:underline cursor-pointer">
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;