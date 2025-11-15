import React, { useMemo, useState } from "react";
import { FiX, FiUpload, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const LOGO_MIN_SIZE = 0; // no minimum for logo
const MAX_LOGO = 10 * 1024 * 1024; // 10MB
const VIDEO_MIN_SIZE = 200 * 1024; // 200KB (keep video constraint)
const MAX_VIDEO = 200 * 1024 * 1024; // 200MB

const isLogoTypeOk = (file) => /image\/jpeg|image\/png/.test(file.type);
const isVideoTypeOk = (file) => /video\/mp4|video\/webm|video\/quicktime/.test(file.type);

// No client-side complexity checks for logos

const BusinessCardWizard = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [logo, setLogo] = useState(null);
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const navigate = useNavigate();

  const canNext = useMemo(() => !!logo, [logo]);
  const canFinish = useMemo(() => !!video && !!projectId, [video, projectId]);

  const onPickLogo = async (file) => {
    setError("");
    if (!file) return;
    if (!isLogoTypeOk(file)) return setError("Only JPG/PNG allowed for logo.");
    if (file.size < LOGO_MIN_SIZE || file.size > MAX_LOGO) return setError("Logo must be up to 10MB.");
    setLogo(file);
  };

  const onPickVideo = (file) => {
    setError("");
    if (!file) return;
    if (!isVideoTypeOk(file)) return setError("Only MP4/WEBM/MOV videos allowed.");
    if (file.size < VIDEO_MIN_SIZE || file.size > MAX_VIDEO) return setError("Video must be 200KB - 200MB.");
    setVideo(file);
  };

  const uploadLogo = async () => {
    if (!logo) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("logo", logo);
      const res = await API.post("/projects/business-card/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const pid = res?.data?.data?.projectId;
      if (!pid) throw new Error("No projectId returned");
      setProjectId(pid);
      setStep(2);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to upload logo.");
    } finally {
      setLoading(false);
    }
  };

  const uploadVideo = async () => {
    if (!video || !projectId) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("video", video);
      fd.append("projectId", projectId);
      const res = await API.post("/projects/business-card/video", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const pid = res?.data?.data?.projectId || projectId;
      onClose?.();
      navigate(`/project/projectEditor/${pid}`);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to upload video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-[#1E293B] rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">AR Business Card Design</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={22} /></button>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <div>
              <h3 className="text-white font-semibold mb-2">Step 1: Upload Logo (JPG/PNG)</h3>
              <p className="text-gray-400 text-sm mb-4">Up to 10MB.</p>
              <label className="block border border-dashed border-blue-500 rounded-lg p-6 text-center cursor-pointer hover:bg-[#0f172a]">
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => onPickLogo(e.target.files?.[0])} />
                <div className="flex flex-col items-center gap-2 text-blue-400">
                  <FiUpload />
                  <span>{logo ? logo.name : "Click to choose logo"}</span>
                </div>
              </label>
              {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button disabled={!canNext || loading} onClick={uploadLogo} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 flex items-center gap-2">
                  Next <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-white font-semibold mb-2">Step 2: Upload Video (MP4/WEBM/MOV)</h3>
              <p className="text-gray-400 text-sm mb-4">200KB - 200MB.</p>
              <label className="block border border-dashed border-blue-500 rounded-lg p-6 text-center cursor-pointer hover:bg-[#0f172a]">
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onPickVideo(e.target.files?.[0])} />
                <div className="flex flex-col items-center gap-2 text-blue-400">
                  <FiUpload />
                  <span>{video ? video.name : "Click to choose video"}</span>
                </div>
              </label>
              {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
              <div className="flex justify-between gap-2 mt-4">
                <button disabled={loading} onClick={() => setStep(1)} className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50 flex items-center gap-2">
                  <FiArrowLeft /> Back
                </button>
                <button disabled={!canFinish || loading} onClick={uploadVideo} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50">
                  Finish
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
            <div className="text-white">Uploading...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCardWizard;
