import axios from 'axios';

// Ganti dengan token yang kamu generate di dashboard → manage account
// Token ini OPSIONAL - tanpa token tetap bisa upload, tapi tidak terhubung ke akun
const AYANAMI_TOKEN = ''; // Isi jika sudah punya token

export const uploadToAyanami = async (imageFile) => {
  try {
    // Validasi file
    if (!imageFile) {
      throw new Error('Tidak ada file yang dipilih');
    }

    // Validasi tipe file (support gambar umum)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Tipe file tidak support. Pakai JPG, PNG, GIF, atau WEBP');
    }

    // Validasi ukuran (max 200MB sesuai dokumentasi ayanami)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (imageFile.size > maxSize) {
      throw new Error(`File terlalu besar. Maksimal 200MB (file kamu ${(imageFile.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Siapkan FormData
    const formData = new FormData();
    formData.append('file', imageFile);

    // Siapkan headers
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    
    // Tambahkan token jika ada
    if (AYANAMI_TOKEN) {
      headers['Authorization'] = `Bearer ${AYANAMI_TOKEN}`;
    }

    // Upload ke Ayanami dengan format response URL
    const response = await axios.post(
        '/api/ayanami?fmt=url', 
      formData, 
      { headers }
    );

    // Response langsung berupa URL (karena pakai ?fmt=url)
    if (response.data && typeof response.data === 'string') {
      return {
        success: true,
        data: {
          url: response.data,
          shortUrl: response.data,
          deleteUrl: null, // Ayanami tidak menyediakan delete URL dari response
        }
      };
    }
    
    // Fallback jika response berupa JSON
    if (response.data && response.data.shortUrl) {
      return {
        success: true,
        data: {
          url: response.data.shortUrl,
          shortUrl: response.data.shortUrl,
          deleteUrl: response.data.deleteUrl || null,
        }
      };
    }

    throw new Error('Response dari server tidak dikenali');
    
  } catch (error) {
    console.error('Error upload ke Ayanami:', error);
    
    let errorMessage = 'Gagal upload gambar';
    if (error.response) {
      // Server merespon dengan status error
      errorMessage = `Server error: ${error.response.status} - ${error.response.data || 'Unknown error'}`;
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      errorMessage = 'Tidak bisa connect ke server. Cek koneksi internetmu.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Fungsi untuk multiple upload
export const uploadMultipleToAyanami = async (files, onProgress) => {
  const results = [];
  let completed = 0;
  
  for (const file of files) {
    const result = await uploadToAyanami(file);
    results.push(result);
    completed++;
    if (onProgress) {
      onProgress(completed, files.length);
    }
  }
  
  return results;
};