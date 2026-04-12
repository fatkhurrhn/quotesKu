import axios from 'axios';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export const uploadImageToImgBB = async (imageFile) => {
  try {
    // Validasi file
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('File type not supported. Please upload JPEG, PNG, GIF, or WEBP');
    }

    // Validasi ukuran (max 32MB)
    const maxSize = 32 * 1024 * 1024; // 32MB
    if (imageFile.size > maxSize) {
      throw new Error('File too large. Maximum size is 32MB');
    }

    // Konversi file ke base64
    const base64Image = await convertFileToBase64(imageFile);
    
    // Kirim ke ImgBB API
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    formData.append('name', imageFile.name || 'uploaded-image');
    
    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: {
          url: response.data.data.url,
          display_url: response.data.data.display_url,
          thumb_url: response.data.data.thumb?.url,
          delete_url: response.data.data.delete_url,
          title: response.data.data.title,
          size: response.data.data.size,
        }
      };
    } else {
      throw new Error('Upload failed: ' + response.data.status);
    }
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
  }
};

// Helper function untuk convert file ke base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Hapus prefix "data:image/xxx;base64," 
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Optional: Upload dari URL
export const uploadImageFromUrl = async (imageUrl) => {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', imageUrl);
    
    const response = await axios.post(IMGBB_UPLOAD_URL, formData);
    
    if (response.data.success) {
      return {
        success: true,
        data: {
          url: response.data.data.url,
          display_url: response.data.data.display_url,
          thumb_url: response.data.data.thumb?.url,
        }
      };
    }
  } catch (error) {
    console.error('Error uploading URL to ImgBB:', error);
    return { success: false, error: error.message };
  }
};