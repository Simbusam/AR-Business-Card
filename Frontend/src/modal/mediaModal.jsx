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
      console.log('🎬 Media Modal: Loading media...');
      setLoading(true);
      setError("");
      try {
        // Images
        let imgData = [];
        try {
          console.log('📸 Fetching images from /assets/my/images');
          const imgRes = await API.get("/assets/my/images");
          console.log('📸 Images response:', imgRes.data);
          imgData = Array.isArray(imgRes?.data?.data) ? imgRes.data.data : [];
          console.log('📸 Parsed images:', imgData.length, 'items');
          if (imgData.length > 0) {
            console.log('📸 Sample image:', imgData[0]);
          }
        } catch (err) {
          console.log('📸 First attempt failed, trying /assets/my with type=image');
          const imgRes2 = await API.get("/assets/my", { params: { type: 'image' } });
          console.log('📸 Images response (2nd attempt):', imgRes2.data);
          imgData = Array.isArray(imgRes2?.data?.data) ? imgRes2.data.data : [];
        }

        // Videos
        let vidData = [];
        try {
          console.log('🎥 Fetching videos from /assets/my/videos');
          const vidRes = await API.get("/assets/my/videos");
          console.log('🎥 Videos response:', vidRes.data);
          vidData = Array.isArray(vidRes?.data?.data) ? vidRes.data.data : [];
          console.log('🎥 Parsed videos:', vidData.length, 'items');
          if (vidData.length > 0) {
            console.log('🎥 Sample video:', vidData[0]);
          }
        } catch (err) {
          console.log('🎥 First attempt failed, trying /assets/my with type=video');
          const vidRes2 = await API.get("/assets/my", { params: { type: 'video' } });
          console.log('🎥 Videos response (2nd attempt):', vidRes2.data);
          vidData = Array.isArray(vidRes2?.data?.data) ? vidRes2.data.data : [];
        }

        if (!mounted) return;
        console.log('✅ Setting state - Images:', imgData.length, 'Videos:', vidData.length);
        setImages(imgData);
        setVideos(vidData);
      } catch (e) {
        console.error('❌ Error loading media:', e);
        console.error('Error details:', {
          message: e?.message,
          response: e?.response?.data,
          status: e?.response?.status
        });
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

      {/* Debug Info */}
      <div className="text-xs" style={{ color: themeColors.textMuted }}>
        {loading && '⏳ Loading...'}
        {!loading && !error && `✅ Loaded ${images.length} images, ${videos.length} videos`}
      </div>

      {error && <div className="text-sm p-3 rounded" style={{ color: '#DC2626', background: '#FEE2E2' }}>{toText(error, 'Failed to load media')}</div>}

      {/* Images Row */}
      <div>
        <div className="mb-3 font-semibold" style={{ color: themeColors.textLight }}>
          Images ({images.length})
        </div>
        {loading ? (
          <div className="text-sm" style={{ color: themeColors.textMuted }}>Loading images...</div>
        ) : images.length === 0 ? (
          <div className="text-sm p-4 rounded border" style={{ color: themeColors.textMuted, borderColor: themeColors.textMuted + '40' }}>
            No images uploaded yet. Upload a logo or business card image to see it here.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <div key={img.id || img.assetId || idx} className="min-w-[200px] max-w-[220px] rounded-lg overflow-hidden border shadow-sm" style={{ borderColor: themeColors.textMuted + '26', background: '#FFFFFF' }}>
                <img
                  src={img.url}
                  alt={toText(img.name, 'image')}
                  className="w-full h-36 object-cover"
                  onError={(e) => {
                    console.error('❌ Image failed to load:', img.url);
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="144"><rect fill="%23ddd" width="200" height="144"/><text x="50%" y="50%" text-anchor="middle" fill="%23999">Failed to load</text></svg>';
                  }}
                  onLoad={() => console.log('✅ Image loaded:', img.url)}
                />
                <div className="p-2 text-xs" style={{ color: themeColors.textMuted }} title={toText(img.name, 'Image')}>
                  {toText(img.name, 'Image')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Row */}
      <div>
        <div className="mb-3 font-semibold" style={{ color: themeColors.textLight }}>
          Videos ({videos.length})
        </div>
        {loading ? (
          <div className="text-sm" style={{ color: themeColors.textMuted }}>Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="text-sm p-4 rounded border" style={{ color: themeColors.textMuted, borderColor: themeColors.textMuted + '40' }}>
            No videos uploaded yet. Upload a video to see it here.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {videos.map((vid, idx) => (
              <div key={vid.id || vid.assetId || idx} className="min-w-[240px] max-w-[260px] rounded-lg overflow-hidden border shadow-sm" style={{ borderColor: themeColors.textMuted + '26', background: '#FFFFFF' }}>
                <video
                  src={vid.url}
                  className="w-full h-36 object-cover"
                  muted
                  loop
                  playsInline
                  onError={(e) => {
                    console.error('❌ Video failed to load:', vid.url);
                  }}
                  onLoadedData={() => console.log('✅ Video loaded:', vid.url)}
                />
                <div className="p-2 text-xs" style={{ color: themeColors.textMuted }} title={toText(vid.name, 'Video')}>
                  {toText(vid.name, 'Video')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MediaModal;