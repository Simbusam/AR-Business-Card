import React, { useEffect, useState } from "react";
import API from "../services/api";
import { themeColors } from "../config/theme";

const MediaModal = () => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toText = (val, fallback = "") => {
    if (val == null) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      if (typeof val.message === 'string') return val.message;
      try { return JSON.stringify(val); } catch { return fallback; }
    }
    return fallback;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Images
        let imgData = [];
        try {
          const imgRes = await API.get("/assets/my/images");
          imgData = Array.isArray(imgRes?.data?.data) ? imgRes.data.data : [];
        } catch (_) {
          const imgRes2 = await API.get("/assets/my", { params: { type: 'image' } });
          imgData = Array.isArray(imgRes2?.data?.data) ? imgRes2.data.data : [];
        }

        // Videos
        let vidData = [];
        try {
          const vidRes = await API.get("/assets/my/videos");
          vidData = Array.isArray(vidRes?.data?.data) ? vidRes.data.data : [];
        } catch (_) {
          const vidRes2 = await API.get("/assets/my", { params: { type: 'video' } });
          vidData = Array.isArray(vidRes2?.data?.data) ? vidRes2.data.data : [];
        }

        if (!mounted) return;
        setImages(imgData);
        setVideos(vidData);
      } catch (e) {
        if (!mounted) return;
        const msg = e?.response?.data?.error || e?.response?.data || e?.message || "Failed to load media";
        setError(toText(msg, "Failed to load media"));
        setImages([]);
        setVideos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="p-4 md:p-6 space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: themeColors.textLight }}>Media</h1>
      {error && <div className="text-sm" style={{ color: '#DC2626' }}>{toText(error, 'Failed to load media')}</div>}
      {loading && <div style={{ color: themeColors.textMuted }}>Loading...</div>}

      {/* Images Row */}
      <div>
        <div className="mb-3 font-semibold" style={{ color: themeColors.textLight }}>Images</div>
        {images.length === 0 ? (
          <div className="text-sm" style={{ color: themeColors.textMuted }}>No images uploaded yet.</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {images.map((img) => (
              <div key={img.id || img.assetId} className="min-w-[200px] max-w-[220px] rounded-lg overflow-hidden border" style={{ borderColor: themeColors.textMuted + '26', background: '#FFFFFF' }}>
                <img src={img.url} alt={toText(img.name, 'image')} className="w-full h-36 object-cover" />
                <div className="p-2 text-xs" style={{ color: themeColors.textMuted }} title={toText(img.name, 'Image')}>{toText(img.name, 'Image')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Row */}
      <div>
        <div className="mb-3 font-semibold" style={{ color: themeColors.textLight }}>Videos</div>
        {videos.length === 0 ? (
          <div className="text-sm" style={{ color: themeColors.textMuted }}>No videos uploaded yet.</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {videos.map((vid) => (
              <div key={vid.id || vid.assetId} className="min-w-[240px] max-w-[260px] rounded-lg overflow-hidden border" style={{ borderColor: themeColors.textMuted + '26', background: '#FFFFFF' }}>
                <video src={vid.url} className="w-full h-36 object-cover" muted loop playsInline />
                <div className="p-2 text-xs" style={{ color: themeColors.textMuted }} title={toText(vid.name, 'Video')}>{toText(vid.name, 'Video')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MediaModal;