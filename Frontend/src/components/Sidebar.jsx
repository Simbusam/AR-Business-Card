import React from "react";
import { themeColors } from "../config/theme";

const Sidebar = ({ selectedTab, setSelectedTab, openModal, isOpen = false, onClose = () => {} }) => {
  const tabs = [
    { label: "🏠 Home", tab: "home" },
    { label: "📁 My Projects", tab: "projects" },
    { label: "🎨 Media", tab: "media" },
    { label: "⚙️ Settings", tab: "settings" },
    { label: "📊 Analytics", tab: "analytics" }
  ];

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 w-64 p-5 flex flex-col border-r bg-[rgba(15,23,42,0.98)]`}
      style={{ borderColor: themeColors.primaryPurple + '40' }}
    >
      {/* Mobile close */}
      <div className="md:hidden flex justify-end mb-2">
        <button onClick={onClose} className="px-3 py-1 rounded border text-sm" style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}>
          Close
        </button>
      </div>
      <nav className="flex-1">
        <ul className="space-y-3">
          {tabs.map((item) => (
            <li key={item.tab}>
              <button
              className="w-full text-left p-3 rounded-lg transition-colors hover:bg-purple-700/30"
                onClick={() => {
                  setSelectedTab(item.tab);
                  openModal(item.tab);
                  onClose();
                }}
                style={{ 
                  //backgroundColor: selectedTab === item.tab ? themeColors.primaryPurple + '30' : 'transparent',
                  
                  color: selectedTab === item.tab ? themeColors.textLight : themeColors.textMuted 
                }}
               
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;