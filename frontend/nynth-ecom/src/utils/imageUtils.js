import imageCompression from "browser-image-compression";

/**
 * Compresses an image file before upload.
 * @param {File} imageFile - The file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - The compressed file
 */
export async function compressImage(imageFile, options = {}) {
    const defaultOptions = {
        maxSizeMB: 1, // Max file size in megabytes
        maxWidthOrHeight: 1200, // Max dimensions
        useWebWorker: true,
        initialQuality: 0.8,
        ...options
    };

    try {
        console.log(`Original size: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
        const compressedFile = await imageCompression(imageFile, defaultOptions);
        console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
    } catch (error) {
        console.error("Image compression error:", error);
        return imageFile; // Fallback to original if compression fails
    }
}
