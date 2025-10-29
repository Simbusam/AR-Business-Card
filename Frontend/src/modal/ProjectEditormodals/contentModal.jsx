import { FiPlus, FiRotateCw, FiSave, FiMousePointer } from "react-icons/fi";

const ContentModal = () => {
  return (
    <div className="flex h-full bg-primaryDark text-textLight">
      {/* Left Sidebar */}
      <div className="w-60 bg-primaryDark border-r border-darkPurple p-4 flex flex-col gap-4">
        <h2 className="text-lg font-bold mb-4">Objects</h2>
        <SidebarButton title="Image" />
        <SidebarButton title="Shapes" />
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 bg-darkPurple relative overflow-hidden">
        <GridBackground />
        <TopToolbar />
      </div>

      {/* Right Sidebar */}
      <div className="w-72 bg-primaryDark border-l border-darkPurple p-4">
        <h2 className="text-lg font-bold mb-4">Properties</h2>
        <div className="text-textMuted">Nothing is selected</div>
      </div>
    </div>
  );
};

const SidebarButton = ({ title }) => {
  return (
    <button className="flex items-center gap-2 w-full text-left px-4 py-2 rounded-md hover:bg-primaryPurple text-textLight transition">
      <FiPlus size={18} />
      {title}
    </button>
  );
};

const GridBackground = () => {
  return (
    <div className="absolute inset-0 bg-darkPurple">
      <div className="h-full w-full bg-grid-small opacity-40" />
    </div>
  );
};

const TopToolbar = () => {
  return (
    <div className="absolute top-4 right-4 flex gap-3">
      <ToolbarButton icon={<FiRotateCw size={20} />} />
      <ToolbarButton icon={<FiSave size={20} />} />
      <ToolbarButton icon={<FiMousePointer size={20} />} />
    </div>
  );
};

const ToolbarButton = ({ icon }) => {
  return (
    <button className="p-2 rounded-md hover:bg-primaryPurple text-textLight transition">
      {icon}
    </button>
  );
};

export default ContentModal;
