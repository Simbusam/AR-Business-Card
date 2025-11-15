import React, { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const CreateProjectModal = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const categories = ["All", "Marker-based", "Markerless", "QR"];

  const services = [
    { key: 'marker', name: 'Marker-based', desc: 'Anchor AR content using image markers.', badge: 'Marker', img: '/images/Ar-Image-Main-page.jpg' },
    { key: 'markerless', name: 'Markerless', desc: 'Place 3D models on detected planes without markers.', badge: 'Plane', img: '/images/Ar-Image-Main-page.jpg' },
    { key: 'qr', name: 'QR', desc: 'Launch AR experiences via QR codes.', badge: 'QR', img: '/images/AR-Business-Cards.jpg' },
  ];

  const filteredServices = services.filter(s =>
    (selectedCategory === 'All' || s.name === selectedCategory)
    && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.desc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleServiceClick = (s) => {
    onClose?.();
    if (s.key === 'marker') {
      navigate('/business-card/design');
    } else {
      navigate(`/coming-soon?from=${s.key}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg sm:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold" style={{color:'#111827'}}>Select your preferred AR Experience</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 space-y-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search project templates..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 placeholder-gray-400 focus:border-[#8B5CF6] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  selectedCategory === category
                    ? "bg-[#8B5CF6] text-white border-transparent"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.map((s) => (
            <div
              key={s.key}
              onClick={() => handleServiceClick(s)}
              className="group cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:border-[#8B5CF6] transition-all duration-200 bg-white"
            >
              <div className="relative h-36 overflow-hidden">
                <img src={s.img} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-3 right-3 text-white text-xs px-2 py-1 rounded" style={{background:'#8B5CF6'}}>
                  {s.badge}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-1" style={{color:'#111827'}}>{s.name}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="text-gray-900 text-lg">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectModal;
