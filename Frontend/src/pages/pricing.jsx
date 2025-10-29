import React from "react";

const plans = [
  {
    name: "Pro",
    price: 25,
    discount: "SAVE 40%",
    features: [
      "Add AR to flat and curved images",
      "Up to 50 AR experiences",
      "120,000 views per year",
      "1 GB of cloud storage",
      "Access reports and analytics",
      "Connect a custom domain",
      "Add features with extensions",
      "Generate content with AI",
      "Lite platform branding",
    ],
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    name: "Ultimate",
    price: 250,
    discount: "SAVE 40%",
    features: [
      "Everything in Pro, plus:",
      "Unlimited AR experiences",
      "Unlimited AR views",
      "5 GB of cloud storage",
      "Design white-label experiences",
      "Create multiscene experiences",
      "Host assets in external storage",
      "Run custom code with Code Editor",
      "No platform branding",
    ],
    gradient: "from-green-500 to-teal-400",
  },
  {
    name: "Ultimate Plus",
    price: 799,
    discount: "SAVE 20%",
    features: [
      "Everything in Ultimate, plus:",
      "Scan real-world environments with Spatial Tracking",
      "Add AR to monuments and landmarks",
      "3D object tracking",
      "Augment electronics, industrial equipment, toys, figurines & more",
      "10 GB of cloud storage",
    ],
    gradient: "from-purple-500 to-pink-400",
  },
  {
    name: "Phygital Marketing",
    price: 959,
    discount: "SAVE 20%",
    features: [
      "Everything in Ultimate Plus, plus:",
      "Get detailed audience insights",
      "Retarget audiences on Facebook, Instagram, Twitter & more",
      "Digitize audience from your products and get valuable data",
      "Create lookalike audiences based on engagement",
    ],
    gradient: "from-pink-500 to-fuchsia-400",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-8">Pricing Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${plan.gradient} text-white p-6 rounded-lg shadow-lg w-full`}
          >
            <h3 className="text-2xl font-semibold">{plan.name}</h3>
            <p className="text-lg mt-2">
              <span className="font-bold text-3xl">${plan.price}</span>/month
            </p>
            <span className="bg-white text-red-500 px-2 py-1 text-sm font-bold rounded mt-2 inline-block">
              {plan.discount}
            </span>
            <button className="w-full bg-white text-gray-900 mt-4 py-2 rounded font-bold hover:bg-gray-200 transition">
              Subscribe
            </button>
            <button className="w-full border border-white mt-2 py-2 rounded text-white hover:bg-white hover:text-gray-900 transition">
              Start Free 14-Day Trial
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span>✔️</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
