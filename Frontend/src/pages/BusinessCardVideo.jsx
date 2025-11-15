import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";

const BusinessCardVideo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const projectId = searchParams.get("projectId") || "";

  const onChoose = (file) => {
    setError("");
    if (!file) return;
    // Allow common formats; backend validates again
    const ok = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ].includes(file.type);
    if (!ok) {
      setError("Please choose MP4/WEBM/MOV/MKV video");
      return;
    }
    setVideo(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) return setError("Missing projectId");
    if (!video) return setError("Please choose a video");

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("projectId", projectId);
      fd.append("video", video);
      const res = await API.post("/projects/business-card/video", fd);
      const pid = res?.data?.data?.projectId || projectId;
      navigate(`/project/projectEditor/${pid}`);
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.error || "Video upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0b1220]">
      <div className="w-full max-w-xl bg-[#1E293B] text-white rounded-xl border border-gray-700 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Upload Business Card Video</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Project ID</label>
            <input
              type="text"
              value={projectId}
              readOnly
              className="w-full px-3 py-2 rounded bg-[#0f172a] border border-gray-700 text-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Choose video (MP4/WEBM/MOV/MKV)</label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
              onChange={(e) => onChoose(e.target.files?.[0])}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
            {video && (
              <div className="text-xs text-gray-400 mt-1">Selected: {video.name}</div>
            )}
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={loading || !video || !projectId}
              className="px-4 py-2 rounded bg-green-600 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessCardVideo;
