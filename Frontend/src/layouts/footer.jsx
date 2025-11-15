import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto text-center py-6 px-4">
        <p className="text-sm md:text-base">
          &copy; 2025 WEBAR. All rights reserved.
        </p>
        <nav className="flex justify-center space-x-4 mt-4">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-white">Support</a>
          <a href="#" className="hover:text-white">Contact</a>
          <a href="#" className="hover:text-white">About</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
