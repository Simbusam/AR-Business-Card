import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { FiExternalLink, FiArrowLeft } from "react-icons/fi";
import API from "../services/api";
import ProjectEditorNavbar from "../layouts/navBar/porjectEditor";
import ProjectEditorSidebar from "../components/ProjectEditorSidebar";
import { themeColors } from "../config/theme";

export default function ARView() {
  const { projectId } = useParams();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadARExperience() {
      setLoading(true);
      setError("");

      try {
        console.log("🔍 Checking AR experience for project:", projectId);

        // Check if AR experience already exists
        const checkRes = await API.get(`/ar/check/${projectId}`);

        if (!checkRes.data.data.arGenerated) {
          // AR experience doesn't exist, generate it
          console.log("🎨 AR experience not found, generating...");
          setGenerating(true);

          try {
            const generateRes = await API.post(`/ar/generate/${projectId}`);
            console.log("✅ AR experience generated:", generateRes.data);
          } catch (genErr) {
            console.error("❌ Error generating AR experience:", genErr);
            throw new Error(
              genErr.response?.data?.message ||
              "Failed to generate AR experience. Make sure you have uploaded both Card.jpg and Video.mp4"
            );
          } finally {
            setGenerating(false);
          }
        }

        // Redirect to standalone AR page (no iframe, no CSP issues!)
        console.log("✅ Redirecting to AR experience...");
        const arUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}/ar-view/${projectId}/index.html`;
        window.location.href = arUrl;

      } catch (err) {
        console.error("❌ Error loading AR experience:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load AR experience"
        );
        setLoading(false);
      }
    }

    loadARExperience();
  }, [projectId]);

  const qrUrl = `${window.location.origin}/ar/${projectId}`;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: themeColors.primaryDark,
        color: themeColors.textLight,
      }}
    >
      {/* Navbar */}
      <ProjectEditorNavbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenProjectActions={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1">
        <ProjectEditorSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-4">AR View</h2>

          <div
            className="w-full border-2 border-dashed rounded-lg mb-6 flex items-center justify-center relative"
            style={{
              minHeight: "400px",
              borderColor: themeColors.primaryPurple + "66",
              backgroundColor: themeColors.primaryPurple + "15",
            }}
          >
            {loading && (
              <div className="text-center">
                {generating ? (
                  <>
                    <div className="text-lg mb-2">🎨 Generating AR Experience...</div>
                    <div className="text-sm opacity-70">Creating dynamic AR content from your assets</div>
                  </>
                ) : (
                  <div className="text-lg">Loading AR content...</div>
                )}
              </div>
            )}

            {!loading && error && (
              <div className="text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded"
                  style={{ backgroundColor: themeColors.primaryPurple, color: 'white' }}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && asset && (
              <>
                {/* 🔹 PRIORITY: HTML View */}
                {asset.type === "html" ? (
                  <iframe
                    src={asset.fileUrl}
                    title="AR Content"
                    className="w-full h-[80vh] border-0 rounded"
                    allowFullScreen
                  />
                ) : asset.type === "image" ? (
                  <img
                    src={asset.fileUrl}
                    alt="AR Content"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : asset.type === "video" ? (
                  <video
                    src={asset.fileUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-gray-400">Unsupported file type</div>
                )}
              </>
            )}
          </div>
 
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      )}
    </div>
  );
}
