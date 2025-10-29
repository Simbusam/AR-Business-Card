import React, { useMemo, useRef, useState } from "react";
import { FiUpload, FiArrowRight, FiArrowLeft, FiExternalLink } from "react-icons/fi";
import API from "../services/api";
import ProjectEditorNavbar from "../layouts/navBar/porjectEditor";
import ProjectEditorSidebar from "../components/ProjectEditorSidebar";
import QRCode from "react-qr-code";
import { themeColors } from "../config/theme";

const LOGO_MIN_SIZE = 0; // no minimum for logo
const MAX_LOGO = 10 * 1024 * 1024; // 10MB
const VIDEO_MIN_SIZE = 200 * 1024; // 200KB
const MAX_VIDEO = 200 * 1024 * 1024; // 200MB

const isLogoTypeOk = (file) => /image\/jpeg|image\/png/.test(file.type);
const isCardTypeOk = (file) => /image\/jpeg|image\/png/.test(file.type);
const isFinalTypeOk = (file) => /video\/mp4|video\/webm|video\/quicktime|model\/gltf-binary|application\/octet-stream/.test(file.type) || /\.glb$/i.test(file.name || '');

export default function BusinessCardDesign() {
  const [step, setStep] = useState(1);
  const [card, setCard] = useState(null);
  const [finalAsset, setFinalAsset] = useState(null); // video or glb
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const cardInputRef = useRef(null);
  const finalInputRef = useRef(null);

  const canNextCard = useMemo(() => !!card, [card]);
  const canFinish = useMemo(() => !!finalAsset && !!projectId, [finalAsset, projectId]);

  const pickError = (e) => {
    const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || e?.toString?.() || 'Request failed';
    return typeof msg === 'object' ? (msg.message || JSON.stringify(msg)) : msg;
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

  const uploadCard = async () => {
    if (!card) return;
    setLoading(true);
    try {
      // Ensure a project exists (template-4 = AR Business Card Design)
      let pid = projectId;
      if (!pid) {
        const create = await API.post('/projects/template', { templateId: 'template-4' });
        pid = create?.data?.data?.id || create?.data?.data?._id || create?.data?.data?.projectId;
        if (!pid) throw new Error('Failed to create project');
        setProjectId(pid);
      }

      const fd = new FormData();
      fd.append("card", card);
      fd.append("projectId", pid);
      const res = await API.post("/projects/business-card/card?noRedirect=1", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newPid = res?.data?.data?.projectId || pid;
      const cardUrl = res?.data?.data?.cardImageUrl;
      setProjectId(newPid);
      setQrUrl(`${window.location.origin}/ar/${newPid}`);
      // Update project thumbnail so it appears on My Projects
      if (cardUrl) {
        try {
          await API.patch?.(`/projects/${newPid}`, { thumbnail: cardUrl });
        } catch (_) {
          try {
            const existing = await API.get(`/projects/${newPid}`);
            const merged = { ...existing?.data?.data, thumbnail: cardUrl };
            await API.put(`/projects/${newPid}`, merged);
          } catch (e2) {
            console.warn('Failed to update project thumbnail from card', e2);
          }
        }
      }
      setStep(2);
    } catch (e) {
      console.error(e);
      setError(pickError(e) || "Failed to upload business card.");
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
      setError(pickError(e) || "Failed to upload final file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: themeColors.primaryDark, color: themeColors.textLight }}>
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: themeColors.textLight }}>AR Business Card Design</h2>
            {/* Scene area shows preview of business card (or placeholder) */}
            <div
              className="w-full border-2 border-dashed rounded-lg mb-6 flex items-center justify-center relative"
              style={{ minHeight: "300px", borderColor: themeColors.primaryPurple + '66', backgroundColor: themeColors.primaryPurple + '15' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onPickCard(f); }}
            >
            {card ? (
              <div className="text-center">
                <img
                  src={URL.createObjectURL(card)}
                  alt="card-preview"
                  className="w-40 h-40 object-contain rounded mx-auto"
                />
                <div className="mt-2 text-sm" style={{ color: themeColors.textMuted }}>Business Card</div>
              </div>
            ) : (
              <div className="text-center" style={{ color: themeColors.textMuted }}>
                <p>Drop your business card image here or use the upload below</p>
              </div>
            )}
          </div>

          {/* Panels */}
          <div className="p-4 md:p-6 rounded-lg grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${themeColors.textMuted}33` }}>
            {step === 1 && (
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-2" style={{ color: themeColors.textLight }}>Upload Business Card</h3>
                <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>JPG/PNG. Up to 10MB.</p>

                <label className="block border border-dashed rounded-lg p-6 text-center cursor-pointer" style={{ borderColor: themeColors.primaryPurple }}>
                  <input
                    ref={cardInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => onPickCard(e.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center gap-2" style={{ color: themeColors.primaryPurple }}>
                    <FiUpload />
                    <span>{card ? card.name : "Click to choose business card"}</span>
                  </div>
                </label>

                <div className="flex justify-between gap-2 mt-4">
                  <button
                    disabled={!canNextCard || loading}
                    onClick={uploadCard}
                    className="px-5 py-2 rounded text-white disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: themeColors.primaryPurple }}
                  >
                    Next <FiArrowRight />
                  </button>
                </div>

                {error && <div className="text-sm mt-2" style={{ color: '#DC2626' }}>{error}</div>}
              </div>
            )}

            {step === 2 && (
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-2" style={{ color: themeColors.textLight }}>Upload Final (Video or GLB)</h3>
                <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>Video: MP4/WEBM/MOV (200KB - 200MB) or GLB model.</p>

                <label className="block border border-dashed rounded-lg p-6 text-center cursor-pointer" style={{ borderColor: themeColors.primaryPurple }}>
                  <input
                    ref={finalInputRef}
                    type="file"
                    accept=".glb,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => onPickFinal(e.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center gap-2" style={{ color: themeColors.primaryPurple }}>
                    <FiUpload />
                    <span>{finalAsset ? finalAsset.name : "Click to choose video or GLB"}</span>
                  </div>
                </label>

                {error && <div className="text-sm mt-2" style={{ color: '#DC2626' }}>{error}</div>}

                <div className="flex justify-between gap-2 mt-4">
                  <button
                    disabled={loading}
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
                    style={{ border: `1px solid ${themeColors.textMuted}33`, color: themeColors.textLight }}
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    disabled={!canFinish || loading}
                    onClick={uploadFinal}
                    className="px-5 py-2 rounded text-white disabled:opacity-50"
                    style={{ backgroundColor: themeColors.primaryPurple }}
                  >
                    Finish
                  </button>
                </div>

                {success && (
                  <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: '#10B9811A', border: '1px solid #10B98133', color: '#065F46' }}>
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
                  <div className="text-sm" style={{ color: themeColors.textLight }}>
                    Scan to view AR on mobile
                    <div className="text-xs mt-1 break-all" style={{ color: themeColors.primaryPurple }}>{qrUrl}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm" style={{ color: themeColors.textMuted }}>QR will appear after upload.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div>Uploading...</div>
        </div>
      )}
    </div>
  );
}
