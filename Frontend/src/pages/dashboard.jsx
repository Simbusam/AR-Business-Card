import React, { useState } from "react";
import { themeColors } from "../config/theme";
import Sidebar from "../components/Sidebar";
import HomeModal from "../modal/homeModal";
import Project from "./project";
import MediaModal from "../modal/mediaModal";
import SettingsModal from "../modal/settingsModal";
import AnalyticsModal from "../modal/analyticsModal";
import { useNavigate, useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const [activeModal, setActiveModal] = useState("home");
  const [selectedTab, setSelectedTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  React.useEffect(() => {
    const tab = params.get('tab');
    if (tab && ["home","projects","media","settings","analytics"].includes(tab)) {
      setActiveModal(tab);
      setSelectedTab(tab);
    }
  }, [params]);

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setSelectedTab(modalName);
    const next = new URLSearchParams(params);
    next.set('tab', modalName);
    setParams(next, { replace: false });
  };

  const closeModal = () => {
    setActiveModal(null);
    const next = new URLSearchParams(params);
    next.delete('tab');
    setParams(next, { replace: false });
  };

  const renderModal = () => {
    switch (activeModal) {
      case 'home':
        return <HomeModal onClose={closeModal} />;
      case 'projects':
        return <Project onClose={closeModal} hideSidebar={true} />;
      case 'media':
        return <MediaModal onClose={closeModal} />;
      case 'settings':
        return <SettingsModal onClose={closeModal} />;
      case 'analytics':
        return <AnalyticsModal onClose={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: themeColors.primaryDark, color: themeColors.textLight }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar 
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        openModal={openModal}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      /> 
      <main className="flex-1 pb-8 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4">
          <button onClick={() => setSidebarOpen(true)} className="px-3 py-2 rounded border" style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}>
            Menu
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        {/* Dashboard content when no modal is open */}
        {!activeModal && (
          <section className="rounded-xl p-4 md:p-6" style={{ backgroundColor: themeColors.primaryPurple + '15' }}>
                <h2 className="text-xl font-semibold">Welcome to User Dashboard</h2>
                  <p className="mt-4" style={{ color: themeColors.textMuted }}>Select a section from the sidebar to navigate more features.</p>
            </section>
        )}

        {/* Render the active modal */}
        {renderModal()}
      </main>
    </div>
  );
};

export default Dashboard;