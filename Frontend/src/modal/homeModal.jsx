import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiPlay } from "react-icons/fi";
import { themeColors } from "../config/theme";


const HomeModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  //const [activeTab, setActiveTab] = useState("home");
  // Construction-specific AR content
  const constructionARApplications = [
    {
      title: "AR for Architectural Visualization",
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
      category: "Design",
      description: "Visualize buildings in real environments before construction begins"
    },
    {
      title: "Equipment Operation Training",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      category: "Safety",
      description: "Train operators with AR simulations of heavy machinery"
    },
    {
      title: "On-Site Measurement Tools",
      image: "https://images.unsplash.com/photo-1581094271901-8022df4466f9", 
      category: "Productivity",
      description: "Digital measuring tools overlay for accurate on-site measurements"
    },
    {
      title: "Structural Defect Detection",
      image: "https://images.unsplash.com/photo-1605106702734-205df224ecce",
      category: "Quality Control",
      description: "AR overlays to identify potential structural issues"
    }
  ];

  const constructionSuccessStories = [
    {
      title: "Prefab Assembly Guidance",
      image: "https://images.unsplash.com/photo-1605152276897-4f618f831968",
      category: "Modular Construction",
      description: "Step-by-step AR instructions for prefabricated components"
    },
    {
      title: "Project Progress Tracking",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85",
      category: "Project Management",
      description: "Compare actual progress with BIM models in real-time"
    },
    {
      title: "Underground Utility Mapping",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789",
      category: "Civil Engineering",
      description: "Visualize underground infrastructure before excavation"
    },
    {
      title: "Safety Hazard Identification",
      image: "https://images.unsplash.com/photo-1581094271901-8022df4466f9",
      category: "Workplace Safety",
      description: "AR overlays to highlight potential safety hazards"
    }
  ];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: themeColors.primaryDark, color: themeColors.textLight }}>
      

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: themeColors.textLight }}>Construction AR Hub</h1>
          <button
            className="px-4 py-2 rounded-lg font-medium hover:opacity-90"
            style={{ backgroundColor: themeColors.secondaryCyan }}
            onClick={() => openModal("project")}
          >
            ➕ Create New Project
          </button>
        </header>

        {/* Modal Section */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div 
              className="w-full max-w-md rounded-xl p-4 sm:p-6"
              style={{ 
                backgroundColor: themeColors.primaryDark,
                border: `1px solid ${themeColors.primaryPurple}`
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: themeColors.textLight }}>
                Create New Project
              </h2>
              <p className="mb-4" style={{ color: themeColors.textMuted }}>
                Choose an option below to proceed with your project.
              </p>
              <div className="space-y-3">
                <Link to="/project">
                  <button 
                    className="w-full p-2 rounded-lg font-medium hover:opacity-90"
                    style={{ backgroundColor: themeColors.primaryPurple }}
                  >
                    Choose Your AR Project
                  </button>
                </Link>
                <button 
                  className="w-full p-2 rounded-lg font-medium"
                  style={{ 
                    backgroundColor: themeColors.primaryPurple + '22',
                    color: themeColors.textLight,
                    border: `1px solid ${themeColors.primaryPurple}`
                  }}
                >
                  Browse Existing Projects
                </button>
              </div>
              <button
                className="mt-6 w-full p-2 rounded-lg font-medium hover:opacity-90"
                style={{ backgroundColor: themeColors.accentPink }}
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Construction AR Applications Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: themeColors.textLight }}>
              AR Applications in Construction
            </h2>
            <Link
              to="/construction-applications"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: themeColors.secondaryCyan }}
            >
              View all <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {constructionARApplications.map((item, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02] h-full flex flex-col"
                style={{
                  backgroundColor: themeColors.primaryPurple + '15',
                  border: `1px solid ${themeColors.primaryPurple + '30'}`
                }}
              >
                <div className="relative pt-[56.25%] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://images.unsplash.com/photo-1605106702734-205df224ecce";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: themeColors.secondaryCyan,
                        color: themeColors.primaryDark
                      }}>
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-grow">
                  <h3 className="font-medium mb-2" style={{ color: themeColors.textLight }}>
                    {item.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: themeColors.textMuted }}>
                    {item.description}
                  </p>
                </div>
                <div className="p-4 pt-0">
                  <button
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{ 
                      backgroundColor: themeColors.primaryPurple,
                      color: themeColors.textLight
                    }}
                  >
                    <FiPlay size={12} /> View Case Study
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Construction Success Stories Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: themeColors.textLight }}>
              AR Success Stories in Construction
            </h2>
            <Link
              to="/construction-success"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: themeColors.secondaryCyan }}
            >
              View all <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {constructionSuccessStories.map((item, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02] h-full flex flex-col"
                style={{
                  backgroundColor: themeColors.primaryPurple + '15',
                  border: `1px solid ${themeColors.primaryPurple + '30'}`
                }}
              >
                <div className="relative pt-[56.25%] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://images.unsplash.com/photo-1605106702734-205df224ecce";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: themeColors.accentPink,
                        color: themeColors.textLight
                      }}>
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-grow">
                  <h3 className="font-medium mb-2" style={{ color: themeColors.textLight }}>
                    {item.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: themeColors.textMuted }}>
                    {item.description}
                  </p>
                </div>
                <div className="p-4 pt-0">
                  <button
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{ 
                      backgroundColor: themeColors.primaryPurple,
                      color: themeColors.textLight
                    }}
                  >
                    <FiPlay size={12} /> Learn How
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Construction AR Tools Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: themeColors.textLight }}>
              AR Tools for Construction Teams
            </h2>
            <Link
              to="/construction-tools"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: themeColors.secondaryCyan }}
            >
              Explore all tools <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Tool 1 */}
            <div className="p-6 rounded-xl flex flex-col" style={{ 
              backgroundColor: themeColors.primaryPurple + '15',
              border: `1px solid ${themeColors.primaryPurple + '30'}`
            }}>
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ 
                backgroundColor: themeColors.secondaryCyan + '30'
              }}>
                <svg className="w-6 h-6" style={{ color: themeColors.secondaryCyan }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2" style={{ color: themeColors.textLight }}>BIM Model Viewer</h3>
              <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
                Overlay BIM models on construction sites with real-time alignment
              </p>
              <Link
                to="/bim-viewer"
                className="mt-auto text-sm flex items-center gap-1 hover:underline"
                style={{ color: themeColors.secondaryCyan }}
              >
                Try now <FiArrowRight size={12} />
              </Link>
            </div>

            {/* Tool 2 */}
            <div className="p-6 rounded-xl flex flex-col" style={{ 
              backgroundColor: themeColors.primaryPurple + '15',
              border: `1px solid ${themeColors.primaryPurple + '30'}`
            }}>
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ 
                backgroundColor: themeColors.accentPink + '30'
              }}>
                <svg className="w-6 h-6" style={{ color: themeColors.accentPink }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2" style={{ color: themeColors.textLight }}>Defect Detection</h3>
              <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
                AR-powered quality control to identify construction defects
              </p>
              <Link
                to="/defect-detection"
                className="mt-auto text-sm flex items-center gap-1 hover:underline"
                style={{ color: themeColors.accentPink }}
              >
                Learn more <FiArrowRight size={12} />
              </Link>
            </div>

            {/* Tool 3 - On-Site Measurement Tools */}
            <div className="p-6 rounded-xl flex flex-col" style={{ 
              backgroundColor: themeColors.primaryPurple + '15',
              border: `1px solid ${themeColors.primaryPurple + '30'}`
            }}>
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ 
                backgroundColor: themeColors.primaryPurple + '30'
              }}>
                <svg className="w-6 h-6" style={{ color: themeColors.primaryPurple }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2" style={{ color: themeColors.textLight }}>On-Site Measurement</h3>
              <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>
                Digital measuring tools overlay for accurate on-site measurements
              </p>
              <Link
                to="/measurement-tools"
                className="mt-auto text-sm flex items-center gap-1 hover:underline"
                style={{ color: themeColors.primaryPurple }}
              >
                Get started <FiArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomeModal;