import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { themeColors } from "../config/theme";

const MarkerBasedLanding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projectId = params.get("projectId") || "";

  const cards = [
    {
      key: "logo",
      title: "AR Logo Upload",
      desc: "Upload your brand logo to use in AR markers.",
      to: "/business-card/design" + (projectId ? `?projectId=${projectId}` : ""),
    },
    {
      key: "video",
      title: "Video Upload",
      desc: "Upload the business card video for playback.",
      to: "/business-card/video" + (projectId ? `?projectId=${projectId}` : ""),
    },
  ];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: themeColors.primaryDark }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: themeColors.textLight }}>Marker-based Setup</h1>
        <p className="mb-6" style={{ color: themeColors.textMuted }}>Choose what you want to upload for your marker-based experience.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map(c => (
            <div key={c.key} className="rounded-xl p-5" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${themeColors.textMuted}20` }}>
              <h3 className="font-semibold mb-1" style={{ color: themeColors.textLight }}>{c.title}</h3>
              <p className="text-sm mb-4" style={{ color: themeColors.textMuted }}>{c.desc}</p>
              <Link to={c.to} className="px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: themeColors.primaryPurple, color: "#FFFFFF" }}>Open</Link>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button className="px-4 py-2 rounded-full border" style={{ borderColor: themeColors.textMuted + '33', color: themeColors.textLight }} onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default MarkerBasedLanding;
