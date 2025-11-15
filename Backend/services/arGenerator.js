/**
 * AR Experience Generator Service
 * Generates dynamic MindAR HTML files for each project
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Generate dynamic MindAR HTML file for a project
 * @param {string} projectId - Project UUID
 * @param {string} cardImageUrl - AWS S3 URL of Card.jpg
 * @param {string} videoUrl - AWS S3 URL of Video.mp4
 * @returns {string} - Generated HTML content
 */
function generateARHTML(projectId, cardImageUrl, videoUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AR Experience - ${projectId}</title>

  <!-- MindAR Libraries - Using CDN-compatible versions -->
  <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"></script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      margin: 0; 
      overflow: hidden; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #start-button {
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-size: 28px;
      cursor: pointer;
      z-index: 20;
      transition: opacity 0.3s;
    }

    #start-button:hover {
      opacity: 0.95;
    }

    #start-button .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    #scan-screen {
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(0,0,0,0.85);
      color: white;
      font-size: 22px;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 15;
      text-align: center;
      padding: 20px;
    }

    #scan-screen .scanning-icon {
      font-size: 48px;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
    }

    #ar-container {
      width: 100%;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
    }

    #loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
      z-index: 10;
      display: none;
    }

    #back-button {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      z-index: 30;
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #back-button:hover {
      background: rgba(255, 255, 255, 1);
    }
  </style>
</head>

<body>

  <!-- BACK BUTTON -->
  <button id="back-button" onclick="window.history.back()">
    ← Back
  </button>

  <!-- TAP TO START SCREEN -->
  <div id="start-button">
    <div class="icon">📱</div>
    <div>Tap to Start AR Experience</div>
    <div style="font-size: 16px; margin-top: 10px; opacity: 0.8;">Point your camera at the business card</div>
  </div>

  <!-- SCANNING SCREEN -->
  <div id="scan-screen">
    <div class="scanning-icon">🔍</div>
    <div>Point your camera at the card</div>
    <div style="font-size: 16px; margin-top: 10px; opacity: 0.7;">Make sure the card is well-lit and in focus</div>
  </div>

  <!-- A-Frame AR Scene -->
  <a-scene
    mindar-image="imageTargetSrc: ${cardImageUrl}; autoStart: false; uiLoading: no; uiError: no; uiScanning: no;"
    color-space="sRGB"
    renderer="colorManagement: true, physicallyCorrectLights"
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false"
    style="display: none;"
    id="ar-scene">

    <a-assets>
      <video
        id="ar-video"
        src="${videoUrl}"
        preload="auto"
        loop="true"
        crossorigin="anonymous"
        playsinline
        webkit-playsinline
        muted></video>
    </a-assets>

    <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

    <a-entity mindar-image-target="targetIndex: 0">
      <a-video
        src="#ar-video"
        position="0 0 0"
        height="1"
        width="1"
        rotation="0 0 0"></a-video>
    </a-entity>
  </a-scene>

  <script>
    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function() {
      const startBtn = document.getElementById("start-button");
      const scanScreen = document.getElementById("scan-screen");
      const arScene = document.getElementById("ar-scene");
      const video = document.getElementById("ar-video");
      let started = false;

      startBtn.onclick = function() {
        if (started) return;
        started = true;

        // Hide start screen, show AR scene and scanning
        startBtn.style.display = "none";
        scanScreen.style.display = "flex";
        arScene.style.display = "block";

        // Start MindAR
        const sceneEl = arScene;
        sceneEl.addEventListener('renderstart', function() {
          console.log("✅ AR Started");
        });

        // Listen for target found/lost events
        sceneEl.addEventListener('targetFound', function() {
          console.log("✅ Target found!");
          scanScreen.style.display = "none";
          video.play().catch(err => console.error("Video play error:", err));
        });

        sceneEl.addEventListener('targetLost', function() {
          console.log("❌ Target lost");
          scanScreen.style.display = "flex";
          video.pause();
        });

        // Start the AR scene
        sceneEl.components['mindar-image'].system.start();
      };
    });
  </script>

</body>
</html>`;
}

/**
 * Save AR HTML file to disk
 * @param {string} projectId - Project UUID
 * @param {string} htmlContent - Generated HTML content
 * @returns {Promise<string>} - Path to saved file
 */
async function saveARFile(projectId, htmlContent) {
  const arDir = path.join(__dirname, '..', 'uploads', 'ar-projects', projectId);

  // Create directory if it doesn't exist
  await fs.mkdir(arDir, { recursive: true });

  const filePath = path.join(arDir, 'index.html');
  await fs.writeFile(filePath, htmlContent, 'utf8');

  return filePath;
}

/**
 * Check if AR file exists for a project
 * @param {string} projectId - Project UUID
 * @returns {Promise<boolean>}
 */
async function arFileExists(projectId) {
  const filePath = path.join(__dirname, '..', 'uploads', 'ar-projects', projectId, 'index.html');
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete AR file for a project
 * @param {string} projectId - Project UUID
 */
async function deleteARFile(projectId) {
  const arDir = path.join(__dirname, '..', 'uploads', 'ar-projects', projectId);
  try {
    await fs.rm(arDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Error deleting AR file:', err);
  }
}

module.exports = {
  generateARHTML,
  saveARFile,
  arFileExists,
  deleteARFile
};

