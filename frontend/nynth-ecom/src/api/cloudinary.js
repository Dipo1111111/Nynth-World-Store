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
    console.error("Error uploading multiple images to Cloudinary:", error);
    throw error;
  }
};
