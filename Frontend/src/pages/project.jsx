import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiChevronDown, FiMoreHorizontal } from "react-icons/fi";
import { useSelector } from "react-redux";
import {
  FaShare,
  FaClone,
  FaCog,
  FaCode,
  FaChartBar,
  FaImage,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import CreateProjectModal from "../modal/CreateProjectModal";
import { themeColors } from "../config/theme";
import Sidebar from "../components/Sidebar";

const Projects = ({ hideSidebar = false }) => {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [menuOpen, setMenuOpen] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const createButtonRef = useRef(null);
  const coverInputRef = useRef(null);
  const [coverTargetId, setCoverTargetId] = useState(null);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("projects");

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (user && user.id) {
      const fetchProjects = async () => {
        setLoading(true);
        try {
          const response = await API.get("/projects", {
            params: { owner: user.id },
          });
          if (response?.data?.data) {
            setProjects(response.data.data);
          } else {
            console.warn("No project data received.");
          }
        } catch (error) {
          console.error("Error fetching projects:", error);
          setError("Error fetching projects. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [user]);

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await API.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => (p.id || p._id) !== projectId));
      setMenuOpen(null);
    } catch (error) {
      console.error("Failed to delete project", error);
      alert("Failed to delete project");
    }
  };

  const filteredProjects = projects
    .filter((p) => (p.name || '').toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy !== 'date') return (a.name || '').localeCompare(b.name || '');
      const ad = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0);
      const bd = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0);
      return bd - ad;
    });

  const openEditor = (projectId) => {
    navigate(`/project/projectEditor/${projectId}`);
  };

  // Trigger file input for Edit Cover
  const startEditCover = (projectId) => {
    setCoverTargetId(projectId);
    setTimeout(() => coverInputRef.current?.click(), 0);
  };

  // Upload new cover and update thumbnail
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !coverTargetId) return;
    try {
      setLoading(true);
      const form = new FormData();
      form.append('file', file);
      // Reuse editor asset endpoint to store upload and get URL
      const up = await API.post(`/projects/${coverTargetId}/assets`, form, { headers: {} });
      const url = up?.data?.data?.url;
      if (!url) throw new Error('Upload did not return URL');
      // Persist thumbnail on project (send only changed field)
      const res = await API.put(`/projects/${coverTargetId}`, { thumbnail: url });
      // Update list in-place, also bump updatedAt to force cache-bust
      const updatedAt = res?.data?.data?.updatedAt || new Date().toISOString();
      setProjects((prev) => prev.map(p => {
        const pid = p.id || p._id;
        if (pid === coverTargetId) {
          return { ...p, thumbnail: res?.data?.data?.thumbnail || url, updatedAt };
        }
        return p;
      }));
    } catch (err) {
      console.error('Edit cover failed:', err);
      alert(err?.response?.data?.error || err.message || 'Failed to update cover');
    } finally {
      setLoading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
      setCoverTargetId(null);
    }
  };

  return (
    <div
      className="relative p-4 md:p-6 min-h-screen"
      style={{
        backgroundColor: themeColors.primaryDark,
        color: themeColors.textLight,
      }}
    >
      {/* Mobile overlay */}
      {!hideSidebar && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar drawer for mobile */}
      {!hideSidebar && (
        <Sidebar
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          openModal={(tab) => {
            // Navigate to dashboard where full modal experience exists
            navigate("/dashboard");
          }}
        />
      )}

      {/* Mobile top bar */}
      {!hideSidebar && (
        <div className="md:hidden flex items-center justify-between mb-4">
          <button onClick={() => setSidebarOpen(true)} className="px-3 py-2 rounded border" style={{ borderColor: themeColors.primaryPurple, color: themeColors.textLight }}>
            Menu
          </button>
          <h1 className="text-lg font-semibold">Projects</h1>
          <div className="w-12" />
        </div>
      )}
      {/* Filter + Sort */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        {/* Add your filter and sort UI here */}
      </div>

      {loading && <div className="text-center text-white">Loading projects...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div
          ref={createButtonRef}
          className="flex flex-col items-center justify-center border-2 border-dashed border-blue-500 bg-[#1E293B] p-6 rounded-xl hover:bg-[#334155] cursor-pointer transition"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="text-4xl text-blue-400">+</div>
          <div className="mt-2 font-semibold text-blue-400 text-center">
            Create New Project
          </div>
        </div>

        {filteredProjects.length === 0 && !loading && !error ? (
          <div className="col-span-full text-center text-gray-400">
            No projects found.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id || project._id}
              className="relative rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
              style={{
                backgroundColor: themeColors.darkPurple,
                color: themeColors.textLight,
              }}
              onClick={() => openEditor(project.id || project._id)} // ✅ Full card is clickable
            >
              <img
                src={(function(){
                  const base = project.thumbnail || (project.assets?.find?.(a => a.type === 'image')?.url) || "/default-thumbnail.jpg";
                  const sep = base.includes('?') ? '&' : '?';
                  // Always force cache bust on each render with Date.now()
                  const ver = Date.now();
                  return `${base}${sep}v=${ver}`;
                })()}
                alt={project.name}
                className="w-full h-40 sm:h-48 object-cover rounded-t-xl"
                onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src='/default-thumbnail.jpg'; }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-white">{project.name}</h3>
                <p className="text-sm text-gray-400">{project.views} views</p>
              </div>

              {/* Menu button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); 
                  const pid = project.id || project._id;
                  setMenuOpen((prev) => (prev === pid ? null : pid));
                }}
                className="absolute bottom-4 right-2 p-2 text-gray-400 hover:bg-gray-700 rounded-full"
              >
                <FiMoreHorizontal size={25} />
              </button>

              {/* Menu options */}
              {menuOpen === (project.id || project._id) && (
                <div className="absolute right-2 top-60 bg-[#1E293B] border border-gray-600 rounded-md shadow-lg w-40 z-50">
                  <MenuItem icon={<FaShare />} label="Share" />
                  <MenuItem icon={<FaClone />} label="Clone" />
                  <MenuItem icon={<FaCog />} label="Settings" />
                  <MenuItem icon={<FaCode />} label="Embed" />
                  <MenuItem icon={<FaChartBar />} label="Analytics" />
                  <MenuItem icon={<FaImage />} label="Edit Cover" onClick={(e)=>{ e.stopPropagation(); setMenuOpen(null); startEditCover(project.id || project._id); }} />
                  <MenuItem
                    icon={<FaTrash />}
                    label="Delete"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ Prevent card navigation
                      handleDelete(project.id || project._id);
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="relative inset-0 z-50">
          <CreateProjectModal onClose={() => setShowCreateModal(false)} />
        </div>
      )}

      {/* Hidden input for Edit Cover */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverFileChange}
      />
    </div>
  );
};

const MenuItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 w-full text-sm text-gray-200 hover:bg-[#334155]"
  >
    {icon}
    {label}
  </button>
);

export default Projects;
