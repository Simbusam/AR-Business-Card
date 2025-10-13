import React, { useMemo, useRef, useState } from "react";
import { FiUpload, FiArrowRight, FiArrowLeft, FiExternalLink } from "react-icons/fi";
import API from "../services/api";
import ProjectEditorNavbar from "../layouts/navBar/porjectEditor";
import ProjectEditorSidebar from "../components/ProjectEditorSidebar";
import QRCode from "react-qr-code";

const LOGO_MIN_SIZE = 0; // no minimum for logo
const MAX_LOGO = 10 * 1024 * 1024; // 10MB
const VIDEO_MIN_SIZE = 200 * 1024; // 200KB
const MAX_VIDEO = 200 * 1024 * 1024; // 200MB

const isLogoTypeOk = (file) => /image\/jpeg|image\/png/.test(file.type);
const isCardTypeOk = (file) => /image\/jpeg|image\/png/.test(file.type);
const isFinalTypeOk = (file) => /video\/mp4|video\/webm|video\/quicktime|model\/gltf-binary|application\/octet-stream/.test(file.type) || /\.glb$/i.test(file.name || '');

export default function BusinessCardDesign() {
  const [step, setStep] = useState(1);
  const [logo, setLogo] = useState(null);
  const [card, setCard] = useState(null);
  const [finalAsset, setFinalAsset] = useState(null); // video or glb
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const logoInputRef = useRef(null);
  const cardInputRef = useRef(null);
  const finalInputRef = useRef(null);

  const canNext = useMemo(() => !!logo, [logo]);
  const canNextCard = useMemo(() => !!card && !!projectId, [card, projectId]);
  const canFinish = useMemo(() => !!finalAsset && !!projectId, [finalAsset, projectId]);

  const onPickLogo = async (file) => {
    setError("");
    if (!file) return;
    if (!isLogoTypeOk(file)) return setError("Only JPG/PNG allowed for logo.");
    if (file.size < LOGO_MIN_SIZE || file.size > MAX_LOGO) return setError("Logo must be up to 10MB.");
    setLogo(file);
  };

  const onPickCard = (file) => {
    setError("");
    if (!file) return;
    if (!isCardTypeOk(file)) return setError("Only JPG/PNG allowed for business card.");
    if (file.size < LOGO_MIN_SIZE || file.size > MAX_LOGO) return setError("Business card image must be up to 10MB.");
    setCard(file);
  };

  const onPickFinal = (file) => {
    setError("");
    if (!file) return;
    if (!isFinalTypeOk(file)) return setError("Only MP4/WEBM/MOV video or GLB file allowed.");
    if ((/video\//.test(file.type)) && (file.size < VIDEO_MIN_SIZE || file.size > MAX_VIDEO)) return setError("Video must be 200KB - 200MB.");
    setFinalAsset(file);
  };

  const uploadLogo = async () => {
    if (!logo) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("logo", logo);
      const res = await API.post("/projects/business-card/logo?noRedirect=1", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const pid = res?.data?.data?.projectId;
      const logoUrl = res?.data?.data?.logoUrl || res?.data?.data?.url || null;
      if (!pid) throw new Error("No projectId returned");
      setProjectId(pid);
      setQrUrl(`${window.location.origin}/ar/${pid}`);
      // Try to update project cover thumbnail when we have a URL
      if (logoUrl) {
        try {
          // Prefer PATCH
          await API.patch?.(`/projects/${pid}`, { thumbnail: logoUrl });
        } catch (_) {
          try {
            // Fallback to merge via PUT
            const existing = await API.get(`/projects/${pid}`);
            const merged = { ...existing?.data?.data, thumbnail: logoUrl };
            await API.put(`/projects/${pid}`, merged);
          } catch (e2) {
            console.warn('Failed to update project thumbnail', e2);
          }
        }
      }
      setStep(2);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to upload logo.");
    } finally {
      setLoading(false);
    }
  };

  const uploadCard = async () => {
    if (!card || !projectId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("card", card);
      fd.append("projectId", projectId);
      const res = await API.post("/projects/business-card/card?noRedirect=1", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const pid = res?.data?.data?.projectId || projectId;
      setProjectId(pid);
      setStep(3);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to upload business card.");
    } finally {
      setLoading(false);
    }
  };

  const uploadFinal = async () => {
    if (!finalAsset || !projectId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("final", finalAsset);
      fd.append("projectId", projectId);
      const res = await API.post("/projects/business-card/final?noRedirect=1", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const pid = res?.data?.data?.projectId || projectId;
      const coverUrl = res?.data?.data?.coverUrl || null; // optional
      setProjectId(pid);
      setQrUrl(`${window.location.origin}/ar/${pid}`);
      setSuccess(true); // stay on this page; show success UI
      if (coverUrl) {
        try {
          await API.patch?.(`/projects/${pid}`, { thumbnail: coverUrl });
        } catch (_) {
          try {
            const existing = await API.get(`/projects/${pid}`);
            const merged = { ...existing?.data?.data, thumbnail: coverUrl };
            await API.put(`/projects/${pid}`, merged);
          } catch (e2) {
            console.warn('Failed to update project thumbnail from video', e2);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to upload final file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1220] text-white">
      {/* Header (reuse editor navbar styles/actions) */}
      <ProjectEditorNavbar 
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenProjectActions={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onShowQR={() => {}}
        onPreview={() => {}}
        onPublish={() => {}}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1">
        <ProjectEditorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 overflow-auto p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-4">AR Business Card Design</h2>
            {/* Scene area */}
            <div
              className="w-full border-2 border-dashed rounded-lg mb-6 flex items-center justify-center relative"
              style={{ minHeight: "300px", borderColor: "#7C5CFC66", backgroundColor: "#7C5CFC22" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onPickLogo(f); }}
            >
            {logo ? (
              <div className="text-center">
                <img
                  src={URL.createObjectURL(logo)}
                  alt="logo-preview"
                  className="w-40 h-40 object-contain rounded mx-auto"
                />
                <div className="mt-2 text-sm text-gray-300">Logo</div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Drop your logo here or use the upload below</p>
              </div>
            )}
          </div>

          {/* Edit panel */}
          <div className="bg-[#1E293B] p-4 md:p-6 rounded-lg border border-gray-700 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {step === 1 && (
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
                <p className="text-gray-400 text-sm mb-4">JPG/PNG. Up to 10MB.</p>

                <label className="block border border-dashed border-blue-500 rounded-lg p-6 text-center cursor-pointer hover:bg-[#0f172a]">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => onPickLogo(e.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center gap-2 text-blue-400">
                    <FiUpload />
                    <span>{logo ? logo.name : "Click to choose logo"}</span>
                  </div>
                </label>

                <div className="flex items-center gap-3 mt-3">
                  {logo && (
                    <button onClick={()=>logoInputRef.current?.click()} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600">Change Logo</button>
                  )}
                </div>

                {error && <div className="text-red-400 text-sm mt-3">{error}</div>}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    disabled={!canNext || loading}
                    onClick={uploadLogo}
                    className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    Next <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-2">Upload Business Card</h3>
                <p className="text-gray-400 text-sm mb-4">JPG/PNG. Up to 10MB.</p>

                <label className="block border border-dashed border-blue-500 rounded-lg p-6 text-center cursor-pointer hover:bg-[#0f172a]">
                  <input
                    ref={cardInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => onPickCard(e.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center gap-2 text-blue-400">
                    <FiUpload />
                    <span>{card ? card.name : "Click to choose business card"}</span>
                  </div>
                </label>

                <div className="flex justify-between gap-2 mt-4">
                  <button
                    disabled={loading}
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    disabled={!canNextCard || loading}
                    onClick={uploadCard}
                    className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    Next <FiArrowRight />
                  </button>
                </div>

                {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
              </div>
            )}

            {step === 3 && (
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-2">Upload Final (Video or GLB)</h3>
                <p className="text-gray-400 text-sm mb-4">Video: MP4/WEBM/MOV (200KB - 200MB) or GLB model.</p>

                <label className="block border border-dashed border-blue-500 rounded-lg p-6 text-center cursor-pointer hover:bg-[#0f172a]">
                  <input
                    ref={finalInputRef}
                    type="file"
                    accept=".glb,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => onPickFinal(e.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center gap-2 text-blue-400">
                    <FiUpload />
                    <span>{finalAsset ? finalAsset.name : "Click to choose video or GLB"}</span>
                  </div>
                </label>

                {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

                <div className="flex justify-between gap-2 mt-4">
                  <button
                    disabled={loading}
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    disabled={!canFinish || loading}
                    onClick={uploadFinal}
                    className="px-5 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    Finish
                  </button>
                </div>

                {success && (
                  <div className="mt-4 p-3 rounded bg-green-600/10 border border-green-700 text-green-300 text-sm">
                    Upload completed. You can continue editing here or open in editor if needed.
                  </div>
                )}
              </div>
            )}
            {/* QR side panel */}
            <div className="lg:col-span-4 flex lg:justify-end">
              {qrUrl ? (
                <div className="flex items-center gap-4 self-start">
                  <QRCode value={qrUrl} size={96} bgColor="#FFFFFF" fgColor="#000000" />
                  <div className="text-sm text-gray-300">
                    Scan to view AR on mobile
                    <div className="text-xs text-blue-400 mt-1 break-all">{qrUrl}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">QR will appear after upload.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-white">Uploading...</div>
        </div>
      )}
    </div>
  );
}
