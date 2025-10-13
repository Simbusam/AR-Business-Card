import React, { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import API from "../services/api";


const CreateProjectModal = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchTemplates();
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await API.get("/templates");
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const categories = ["All", "Equipment Simulation", "Assembly Guidance", "Safety Training", "Blueprint Visualization"];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateClick = async (template) => {
    // If AR Business Card Design, go to dedicated page instead of popup
    if (template?.name === "AR Business Card Design") {
      onClose?.();
      navigate('/business-card/design');
      return;
    }
    try {
      setLoading(true);

      const res = await API.post("/projects/template", {
        templateId: template._id,
      });

      const newProjectId = res.data.data._id;
      onClose();
      navigate(`/project/projectEditor/${newProjectId}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-[0px]">
      <div className="bg-[#1E293B] rounded-xl w-full max-w-lg sm:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Select your preferred AR Experience</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 space-y-4 border-b border-gray-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search project templates..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0F172A] border border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-[#0F172A] text-gray-300 hover:bg-[#1E3050]"
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
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template._id}
                onClick={() => handleTemplateClick(template)}
                className="group cursor-pointer rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-200"
              >
                <div className="relative h-32 sm:h-40 overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    {template.type}
                  </span>
                </div>
                <div className="p-4 bg-[#0F172A]">
                  <h3 className="font-bold text-white mb-1">{template.name}</h3>
                  <p className="text-gray-400 text-sm">{template.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-400">
              No matching project templates found
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-600 text-white hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-white text-lg">Creating project...</div>
        </div>
      )}

      {/* BusinessCardWizard popup removed; now using dedicated page /business-card/design */}
    </div>
  );
};

export default CreateProjectModal;
