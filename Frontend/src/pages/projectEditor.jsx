import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { themeColors } from "../config/theme";
import ProjectEditorSidebar from "../components/ProjectEditorSidebar";
import ProjectEditorNavbar from "../layouts/navBar/porjectEditor";
import API from "../services/api";
import QRCode from "react-qr-code"; 

const ProjectEditor = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [sceneObjects, setSceneObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const qrRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const res = await API.get(`/projects/${projectId}`);
      setProject(res.data.data);
      setSceneObjects(res.data.data.sceneObjects || []);
      generateQrCode(res.data.data);
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const applyImageFile = (file) => {
    if (!file || !selectedObject) return;
    const newObject = {
      ...selectedObject,
      image: URL.createObjectURL(file),
      rawImage: file,
    };
    const updatedObjects = sceneObjects.map((obj) =>
      obj.id === selectedObject.id ? newObject : obj
    );
    setSceneObjects(updatedObjects);
    setSelectedObject(newObject);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    applyImageFile(file);
    // reset input so selecting same file again still triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSceneDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    applyImageFile(file);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // 1) Upload any raw images to backend and replace with returned URLs
      const updated = [];
      for (const obj of sceneObjects) {
        if (obj.rawImage) {
          const form = new FormData();
          form.append('file', obj.rawImage);
          try {
            const res = await API.post(`/projects/${projectId}/assets`, form, {
              headers: { /* let browser set multipart boundary */ },
            });
            const { url } = res.data.data || {};
            updated.push({ ...obj, image: url, rawImage: undefined });
          } catch (err) {
            console.error('Asset upload failed:', err);
            const msg = err?.response?.data?.error?.message || err?.message || 'Asset upload failed';
            alert(`Asset upload failed: ${msg}`);
            setLoading(false);
            return; // stop save if any asset upload fails
          }
        } else {
          updated.push(obj);
        }
      }
      setSceneObjects(updated);

      // 2) Persist project JSON
      const payload = {
        ...project,
        sceneData: project?.sceneData || {},
        sceneObjects: updated.map((o) => {
          const { rawImage, ...rest } = o;
          return rest;
        }),
      };

      const saveRes = await API.put(`/projects/${projectId}`, payload);
      setProject(saveRes.data.data);

      // 3) Refresh QR URL when project exists
      if (saveRes?.data?.data?._id) {
        generateQrCode(saveRes.data.data);
      }
      alert("Project saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      const msg = error?.response?.data?.error?.message || error?.message || 'Failed to save project.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const generateQrCode = (projectData) => {
    const url = `${window.location.origin}/ar/${projectData._id}`;
    setQrCodeUrl(url);
  };

  // Header actions
  const handleOpenProjectActions = () => {
    // For now, just scroll to top of page where title is; later can open a modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowQR = () => {
    if (qrRef.current) {
      qrRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePreview = () => {
    if (qrCodeUrl) window.open(qrCodeUrl, '_blank', 'noopener');
  };

  const handlePublish = async () => {
    await handleSave();
  };

  const addEmptyObject = () => {
    const newObject = {
      id: Date.now(),
      type: "Image",
      position: { x: 0, y: 0, z: 0 },
    };
    setSceneObjects([...sceneObjects, newObject]);
    setSelectedObject(newObject);
    // Immediately prompt for image pick
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: themeColors.primaryDark }}>
      {/* Header (always visible) */}
      <ProjectEditorNavbar 
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenProjectActions={handleOpenProjectActions}
        onShowQR={handleShowQR}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-1">
        <ProjectEditorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-auto p-4 md:p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">{project?.name || "Project Editor"}</h2>

        {/* Scene Area */}
        <div
          className="w-full border-2 border-dashed rounded-lg mb-6 flex items-center justify-center relative"
          style={{
            minHeight: "300px",
            backgroundColor: themeColors.primaryPurple + "15",
            borderColor: themeColors.primaryPurple + "40",
          }}
          onDragOver={(e)=>e.preventDefault()}
          onDrop={handleSceneDrop}
        >
          {sceneObjects.length === 0 ? (
            <div className="text-center text-gray-400">
              <p>No AR objects yet.</p>
              <button onClick={addEmptyObject} className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
                Add Image Object
              </button>
              <div className="mt-2 text-xs text-gray-500">or drag & drop an image here</div>
            </div>
          ) : (
            <div className="absolute inset-0 flex justify-center items-center flex-wrap gap-6">
              {sceneObjects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObject(obj)}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedObject?.id === obj.id
                      ? "border-2 border-blue-500 bg-blue-500/20"
                      : "border border-transparent bg-blue-500/10"
                  }`}
                >
                  {obj.image ? (
                    <img
                      src={obj.image}  // Ensure this is the updated image URL
                      alt="AR"
                      className="w-32 h-32 object-contain rounded"
                    />
                  ) : (
                    <button onClick={()=>fileInputRef.current?.click()} className="w-32 h-32 bg-gray-800 flex items-center justify-center text-sm text-gray-300 rounded border border-dashed border-gray-600 hover:bg-gray-700">
                      Click to upload
                    </button>
                  )}
                  <p className="text-center mt-2 text-sm">{obj.type}</p>
                </div>
              ))}
            </div>
          )}
          {/* Hidden file input used by buttons and click targets */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        {/* Object Properties */}
        {selectedObject && (
          <div className="bg-[#1E293B] p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">Edit Object</h3>

            <label className="block mb-2 text-sm">Upload Image</label>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={()=>fileInputRef.current?.click()} className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700">Choose File</button>
              <span className="text-xs text-gray-400">or drag & drop into the canvas</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {["x", "y", "z"].map((axis) => (
                <div key={axis}>
                  <label className="block text-xs mb-1">
                    Position {axis.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600"
                    value={selectedObject.position[axis]}
                    onChange={(e) => {
                      const newPos = {
                        ...selectedObject.position,
                        [axis]: parseFloat(e.target.value) || 0,
                      };
                      const newObj = { ...selectedObject, position: newPos };
                      setSelectedObject(newObj);
                      setSceneObjects((prev) =>
                        prev.map((obj) =>
                          obj.id === newObj.id ? newObj : obj
                        )
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 rounded hover:bg-green-700"
          >
            {loading ? "Saving..." : "Save Project"}
          </button>

          {qrCodeUrl && (
            <div ref={qrRef} className="flex items-center gap-4 self-start sm:self-auto">
              <QRCode value={qrCodeUrl} size={80} bgColor="#FFFFFF" fgColor="#000000" />
              <div className="text-sm text-gray-300">
                Scan to view AR on mobile
                <div className="text-xs text-blue-400 mt-1">{qrCodeUrl}</div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectEditor;
