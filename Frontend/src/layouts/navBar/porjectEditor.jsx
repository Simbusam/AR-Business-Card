// src/components/ProjectEditorNavbar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { themeColors } from "../../config/theme";
import {
  FiArrowLeft,
  FiChevronUp,
  FiChevronDown,
  FiDownload,
  FiUpload,
  FiUser,
  FiCheck
} from "react-icons/fi";
import { FaRegEye, FaQrcode, FaCloud } from "react-icons/fa";

const ProjectEditorNavbar = ({
  onOpenSidebar = () => {},
  onOpenProjectActions = () => {},
  onShowQR = () => {},
  onPreview = () => {},
  onPublish = () => {}
}) => {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  return (
    <>
    <header
      className="flex justify-between items-center px-4 md:px-6 py-3 shadow-md relative"
      style={{ backgroundColor: themeColors.darkPurple }}
    >
      {/* Left: Logo + Back Button */}
      <div className="flex items-center gap-6">
        <div className="flex items-center">
          <Link
            to="/dashboard"
            className="text-2xl font-bold tracking-tight mr-2"
            style={{
              background: 'linear-gradient(45deg, #00C2CB, #6C5CE7)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
            }}
          >
            WEBAR
          </Link>
        </div>

        <Link
          to="/dashboard"
          className="flex items-center text-[#E0E0E0] hover:text-cyan-300 transition-colors duration-200 text-sm gap-1"
        >
          <FiArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>

      {/* Right: All action buttons (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-4">
        {/* Project Dropdown */}
        <div className="relative">
          <button 
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: themeColors.primaryPurple + '30',
              color: themeColors.textLight,
              border: `1px solid ${themeColors.primaryPurple}`
            }}
            onClick={() => { setShowProjectDropdown(!showProjectDropdown); onOpenProjectActions(); }}
          >
            Project
            <div className="flex flex-col ml-1">
              <FiChevronUp size={12} />
              <FiChevronDown size={12} style={{ marginTop: -4 }} />
            </div>
          </button>
          
          {showProjectDropdown && (
            <div 
              className="absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg z-10"
              style={{
                backgroundColor: themeColors.darkPurple,
                border: `1px solid ${themeColors.primaryPurple}`
              }}
            >
              <div className="py-1">
                <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-purple-700">
                  <FiDownload className="mr-2" /> Import Project
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-purple-700">
                  <FiUpload className="mr-2" /> Export Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QR Button */}
        <button
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: themeColors.primaryPurple + '30',
            color: themeColors.textLight,
            border: `1px solid ${themeColors.primaryPurple}`
          }}
          onClick={onShowQR}
        >
          <FaQrcode size={16} />
          QR Code
        </button>

        {/* Preview Button */}
        <button
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: themeColors.primaryPurple + '30',
            color: themeColors.textLight,
            border: `1px solid ${themeColors.primaryPurple}`
          }}
          onClick={onPreview}
        >
          <FaRegEye size={16} />
          Preview
        </button>
        
        {/* Publish Button with tick inside cloud */}
        <button
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium relative"
          style={{
            backgroundColor: themeColors.secondaryCyan,
            color: themeColors.textLight,
            paddingLeft: '2.5rem' // Make room for the cloud icon
          }}
          onClick={onPublish}
        >
          <div className="absolute left-3">
            <FaCloud size={18} />
            <FiCheck 
              size={10} 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
            />
          </div>
          Publish
        </button>

        {/* User Account Icon */}
        <div className="relative ml-2">
          <button 
            className="p-2 rounded-full hover:bg-purple-700 transition-colors"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <FiUser size={20} style={{ color: themeColors.textLight }} />
          </button>
          
          {showUserDropdown && (
            <div 
              className="absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg z-10"
              style={{
                backgroundColor: themeColors.darkPurple,
                border: `1px solid ${themeColors.primaryPurple}`
              }}
            >
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-700">
                  My Profile
                </button>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-700">
                  Account Settings
                </button>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-purple-700">
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}
        >
          Menu
        </button>
        <button
          onClick={() => setMobileActionsOpen((v)=>!v)}
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}
        >
          Actions
        </button>
      </div>
    </header>
    {/* Mobile actions dropdown */}
    {mobileActionsOpen && (
      <div className="md:hidden px-4 py-3 border-b" style={{ borderColor: themeColors.primaryPurple + '40', backgroundColor: themeColors.darkPurple }}>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onOpenProjectActions} className="px-3 py-2 rounded text-left" style={{ backgroundColor: themeColors.primaryPurple + '30', color: themeColors.textLight, border: `1px solid ${themeColors.primaryPurple}` }}>Project</button>
          <button onClick={onShowQR} className="px-3 py-2 rounded text-left" style={{ backgroundColor: themeColors.primaryPurple + '30', color: themeColors.textLight, border: `1px solid ${themeColors.primaryPurple}` }}>QR Code</button>
          <button onClick={onPreview} className="px-3 py-2 rounded text-left" style={{ backgroundColor: themeColors.primaryPurple + '30', color: themeColors.textLight, border: `1px solid ${themeColors.primaryPurple}` }}>Preview</button>
          <button onClick={onPublish} className="px-3 py-2 rounded text-left" style={{ backgroundColor: themeColors.secondaryCyan, color: themeColors.textLight }}>Publish</button>
        </div>
      </div>
    )}
    </>
  );
};

export default ProjectEditorNavbar;