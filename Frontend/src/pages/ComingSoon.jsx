import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { themeColors } from "../config/theme";

const ComingSoon = () => {
  const [params] = useSearchParams();
  const from = params.get("from") || "service";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: themeColors.primaryDark }}>
      <div className="w-full max-w-lg bg-white rounded-xl border" style={{ borderColor: themeColors.textMuted + '26' }}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: themeColors.textLight }}>Coming Soon</h1>
          <p className="mb-6" style={{ color: themeColors.textMuted }}>
            The {from} experience is under development. You can start with Marker-based now.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-full font-medium opacity-60 cursor-not-allowed" style={{ backgroundColor: themeColors.textMuted + '33', color: themeColors.textLight }} disabled>
              Coming Soon
            </button>
            <Link to="/business-card/design" className="px-4 py-2 rounded-full font-medium" style={{ backgroundColor: themeColors.primaryPurple, color: '#FFFFFF' }}>
              Go to Marker-based
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
