// src/api/cloudinary.js

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 *
 * You MUST set the following Environment Variables in your .env file:
 * VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 * VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
 *
 * @param {File} file
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary environment variables. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

/**
 * Uploads multiple files sequentially to Cloudinary.
 *
 * @param {File[]} files
 * @returns {Promise<string[]>} Array of secure URLs
 */
export const uploadMultipleImagesToCloudinary = async (files) => {
  try {
    const uploadPromises = files.map(file => uploadImageToCloudinary(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
};

/**
 * Appends Cloudinary auto-format/quality transforms to a Cloudinary URL.
 * Non-Cloudinary URLs pass through unchanged.
 *
 * @param {string} url - Cloudinary image URL
 * @param {object} opts - Optional overrides
 * @param {number} opts.width - Max width (default 2000)
 * @param {number} opts.quality - Quality 1-100, 'auto' for Cloudinary default
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, { width = 2000, quality = 'auto' } = {}) => {
  if (!url || typeof url !== 'string') return url;
  // Only transform Cloudinary URLs
  if (!url.includes('cloudinary.com')) return url;

  // Cloudinary URL pattern: .../image/upload/[transformations/]v.../file.ext
  // Insert f_auto (WebP/AVIF), q_auto, w_{width} before the version or public_id
  const optimized = url.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_${quality},w_${width}/`
  );
  return optimized;
};
