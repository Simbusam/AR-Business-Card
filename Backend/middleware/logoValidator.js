const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

// Heuristic validator to reject overly simple single-letter logos
// Strategy:
// - Ensure min dimensions
// - Compute entropy via sharp.stats()
// - Downscale to 128x128 grayscale and measure foreground pixel ratio
//   using a simple threshold (near-white treated as background)
// - If entropy is too low AND foreground coverage is very small, reject
// - Clean up the uploaded file on rejection
module.exports = async function validateLogoDesign(req, res, next) {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Logo image is required', 400));
    }

    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // Read metadata and entropy
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Basic sanity checks
    if (!metadata.width || !metadata.height) {
      cleanup(filePath);
      return next(new ErrorResponse('Invalid image file', 400));
    }

    // Require at least 128px minimal side for meaningful analysis
    if (Math.min(metadata.width, metadata.height) < 128) {
      cleanup(filePath);
      return next(new ErrorResponse('Logo resolution too small. Please upload a clearer logo.', 400));
    }

    const stats = await image.stats();
    const entropy = stats.entropy; // 0..8 approx

    // Compute foreground coverage
    const size = 128;
    const buf = await image
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: '#ffffff' })
      .grayscale()
      .raw()
      .toBuffer();

    const total = buf.length; // one byte per pixel in grayscale raw
    // Treat near-white as background. Count darker pixels as foreground.
    let foreground = 0;
    for (let i = 0; i < total; i++) {
      if (buf[i] < 230) foreground++;
    }
    const foregroundRatio = foreground / total;

    // Debug logging to help tune thresholds (safe for server logs)
    console.log('[LogoValidator]', {
      file: req.file.originalname,
      sizeBytes: req.file.size,
      width: metadata.width,
      height: metadata.height,
      entropy: Number(entropy.toFixed(3)),
      foregroundRatio: Number(foregroundRatio.toFixed(3))
    });

    // Heuristic thresholds tuned to catch big single letters on plain bg
    // Further relaxed to reduce false positives on wordmarks or logos with text
    const lowEntropy = entropy < 1.2; // stricter (lower) threshold
    const sparseForeground = foregroundRatio < 0.01; // require extremely sparse ink (<1%)

    if (lowEntropy && sparseForeground) {
      cleanup(filePath);
      return next(
        new ErrorResponse(
          'Logo seems too simplistic (e.g., single letter on plain background). Please upload a more designed logo.',
          400
        )
      );
    }

    // Pass validation
    return next();
  } catch (err) {
    // On analysis errors, be safe and reject
    try {
      if (req.file && req.file.filename) {
        const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
        cleanup(filePath);
      }
    } catch (e) {}
    return next(new ErrorResponse('Failed to analyze logo. Please try another image.', 400));
  }
};

function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
}
