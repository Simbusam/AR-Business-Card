const templatesHardcoded = [
  {
    _id: "template-1",
    name: "Crane Operation AR Simulator",
    description: "Interactive training for crane operators with real-time physics feedback",
    thumbnail: "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
    type: "Equipment Simulation",
    defaultExperiences: ["experience-1a", "experience-1b"],
    defaultSettings: {
      qualityPreset: "high",
      analyticsEnabled: true,
      offlineAccess: false
    },
    createdBy: "user-1"
  },
  {
    _id: "template-2",
    name: "Structural Steel Assembly Guide",
    description: "Step-by-step AR instructions for steel beam installation",
    thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    type: "Assembly Guidance",
    defaultExperiences: ["experience-2a"],
    defaultSettings: {
      qualityPreset: "medium",
      analyticsEnabled: true,
      offlineAccess: true
    },
    createdBy: "user-2"
  },
  {
    _id: "template-3",
    name: "Site Safety Hazard Scanner",
    description: "AR overlay identifying potential safety risks on construction sites",
    thumbnail: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    type: "Safety Training",
    defaultExperiences: ["experience-3a", "experience-3b", "experience-3c"],
    defaultSettings: {
      qualityPreset: "ultra",
      analyticsEnabled: false,
      offlineAccess: false
    },
    createdBy: "user-3"
  }
  ,
  {
    _id: "template-4",
    name: "AR Business Card Design",
    description: "Create AR-enabled business cards with your logo and an intro video",
    thumbnail: "https://images.unsplash.com/photo-1511715280172-233c42b6a83e?auto=format&fit=crop&w=800&q=80",
    type: "Design",
    defaultExperiences: [],
    defaultSettings: {
      qualityPreset: "high",
      analyticsEnabled: true,
      offlineAccess: false
    },
    createdBy: "system"
  }
];

module.exports = templatesHardcoded;