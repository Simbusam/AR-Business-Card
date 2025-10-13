import { FiUpload, FiDownload, FiX } from "react-icons/fi";
import { themeColors } from "../../config/theme";

const SettingsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[0px] flex items-center justify-center z-50 p-4">
      <div 
        className="bg-[#1E293B] rounded-xl w-full max-w-md border border-gray-700"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-20 text-sm text-gray-300">Name</label>
                <input
                  type="text"
                  defaultValue="Project 4"
                  className="flex-1 bg-[#0F172A] border border-gray-700 text-white rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="w-20 text-sm text-gray-300">Link</label>
                <input
                  type="text"
                  value="mywebar.com/p/Project_4_vollbloksas"
                  disabled
                  className="flex-1 bg-[#0F172A] border border-gray-700 text-gray-400 rounded px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* QR Code Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">QR Code Settings</h3>
            
            {/* Download Section */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Download</span>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-[#0F172A] border border-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option>JPG</option>
                  <option>PNG</option>
                </select>
                <button 
                  className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-white"
                  style={{
                    backgroundColor: themeColors.primaryPurple,
                    border: `1px solid ${themeColors.primaryPurple}`
                  }}
                >
                  <FiDownload size={14} />
                </button>
              </div>
            </div>

            {/* Shape Options */}
            <div className="space-y-3">
              <ShapeOption label="Shape" />
              <ShapeOption label="Body Shape" />
              <ShapeOption label="Eye Shape" />
            </div>

            {/* Color Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Shapes</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    defaultValue="#000000"
                    className="w-6 h-6 rounded cursor-pointer"
                  />
                  <span className="text-white text-xs">#000000</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    defaultValue="#FFFFFF"
                    className="w-6 h-6 rounded cursor-pointer"
                  />
                  <span className="text-white text-xs">#FFFFFF</span>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Logo</span>
              <button 
                className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: themeColors.primaryPurple + '30',
                  color: themeColors.textLight,
                  border: `1px solid ${themeColors.primaryPurple}`
                }}
              >
                <FiUpload size={14} />
                Upload...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShapeOption = ({ label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-300">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((_, idx) => (
        <button
          key={idx}
          className={`w-6 h-6 rounded-sm ${idx === 0 ? 'bg-blue-500' : 'bg-[#0F172A] border border-gray-700'}`}
        />
      ))}
    </div>
  </div>
);

export default SettingsModal;