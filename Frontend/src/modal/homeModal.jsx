import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiPlay } from "react-icons/fi";
import { themeColors } from "../config/theme";
import CreateProjectModal from "./CreateProjectModal";

const HomeModal = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const services = [
    {
      key: 'marker',
      title: 'Marker-based AR',
      desc: 'Anchor AR content using image markers.',
    },
    {
      key: 'markerless',
      title: 'Markerless AR',
      desc: 'Place 3D models on detected planes without markers.',
    },
    {
      key: 'qr',
      title: 'QR AR',
      desc: 'Launch AR experiences via QR codes.',
    }
  ];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF', color: themeColors.textLight }}>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <span style={{ color: themeColors.textMuted }}>My Projects</span>
              <span style={{ color: themeColors.textMuted }}>Media</span>
            </nav>
          </div>
          <button
            className="px-4 py-2 rounded-full font-medium hover:opacity-90"
            style={{ backgroundColor: themeColors.primaryPurple, color: '#FFFFFF' }}
            onClick={() => setIsModalOpen(true)}
          >
            + Create New Project
          </button>
        </header>

        <h1 className="text-2xl font-bold mb-2" style={{ color: themeColors.textLight }}>AR Services</h1>
        <h2 className="text-sm mb-6" style={{ color: themeColors.textMuted }}>Available Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pr-0 md:pr-6">
          {services.map((s) => {
            const to = s.key === 'marker' ? '/business-card/design' : `/coming-soon?from=${s.key}`;
            return (
            <div
              key={s.key}
              className="rounded-xl p-5 cursor-pointer"
              style={{ backgroundColor: '#FFFFFF', border: `1px solid ${themeColors.textMuted}20` }}
              onClick={() => navigate(to)}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: themeColors.primaryPurple + '22' }}>
                <svg className="w-5 h-5" style={{ color: themeColors.primaryPurple }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path d="M12 7v5l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1" style={{ color: themeColors.textLight }}>{s.title}</h3>
              <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>{s.desc}</p>
              <Link to={to} className="text-sm" style={{ color: themeColors.secondaryCyan }} onClick={(e)=>e.stopPropagation()}>Open →</Link>
            </div>
          );})}
        </div>
        {isModalOpen && (
          <div className="relative inset-0 z-50"><CreateProjectModal onClose={() => setIsModalOpen(false)} /></div>
        )}
      </main>
    </div>
  );
};

export default HomeModal;