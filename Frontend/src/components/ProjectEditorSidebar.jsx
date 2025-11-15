
import React from "react";
import { FiLayers, FiSettings } from "react-icons/fi";
import { themeColors } from "../config/theme";

const ProjectEditorSidebar = ({ selectedTab, openModal, isOpen = false, onClose = () => {} }) => {
  return (
    <div
      className={`fixed md:static inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 w-16 flex flex-col items-center py-4 border-r`}
      style={{
        backgroundColor: themeColors.primaryDark,
        borderColor: themeColors.primaryPurple + '40'
      }}
    >
      {/* mobile close */}
      <button onClick={onClose} className="md:hidden mb-4 px-2 py-1 text-xs rounded border" style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}>
        Close
      </button>
      {/* Content Button */}
      <button
        onClick={() => openModal('content')}
        className={`p-3 rounded-lg mb-4 flex flex-col items-center ${
          selectedTab === 'content' 
            ? 'text-white bg-blue-600' 
            : 'text-gray-400 hover:bg-gray-700'
        }`}
        title="Content"
        style={{
          backgroundColor: selectedTab === 'content' 
            ? themeColors.secondaryCyan 
            : 'transparent',
          color: selectedTab === 'content' 
            ? themeColors.textLight 
            : themeColors.textMuted
        }}
      >
        <FiLayers size={20} />
        <span className="text-xs mt-1">Content</span>
      </button>

      {/* Settings Button */}
      <button
        onClick={() => openModal('settings')}
        className={`p-3 rounded-lg flex flex-col items-center ${
          selectedTab === 'settings' 
            ? 'text-white bg-blue-600' 
            : 'text-gray-400 hover:bg-gray-700'
        }`}
        title="Settings"
        style={{
          backgroundColor: selectedTab === 'settings' 
            ? themeColors.secondaryCyan 
            : 'transparent',
          color: selectedTab === 'settings' 
            ? themeColors.textLight 
            : themeColors.textMuted
        }}
      >
        <FiSettings size={20} />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  );
};

export default ProjectEditorSidebar;