import React, { useState, useEffect } from 'react';
import { uploadToAyanami } from '../services/ayanamiService';

export default function BahanReels() {
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [downloading, setDownloading] = useState(null); // Track download status

    // Load saved images dari localStorage
    useEffect(() => {
        const savedImages = localStorage.getItem('ayanami_uploaded_images');
        if (savedImages) {
            setUploadedImages(JSON.parse(savedImages));
        }
    }, []);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Preview gambar
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Upload
        setUploading(true);
        setError(null);

        const result = await uploadToAyanami(file);

        if (result.success) {
            // Simpan ke state
            const newImages = [{
                id: Date.now(),
                url: result.data.url,
                shortUrl: result.data.shortUrl,
                filename: file.name,
                fileSize: file.size,
                fileType: file.type,
                uploadedAt: new Date().toISOString()
            }, ...uploadedImages];

            setUploadedImages(newImages);

            // Simpan ke localStorage
            localStorage.setItem('ayanami_uploaded_images', JSON.stringify(newImages));

            setSuccessMessage('✅ Gambar berhasil diupload!');
            setTimeout(() => setSuccessMessage(null), 3000);

            // Clear preview
            setTimeout(() => {
                setPreview(null);
            }, 2000);
        } else {
            setError(result.error);
            setTimeout(() => setError(null), 5000);
            setPreview(null);
        }

        setUploading(false);
        event.target.value = ''; // Reset input
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccessMessage('📋 Link berhasil disalin!');
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    // === FITUR DOWNLOAD ===
    const downloadImage = async (imageUrl, filename) => {
        setDownloading(imageUrl);
        try {
            // Fetch gambar dari URL
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Buat link download
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Bersihkan nama file (hapus spasi, tambah timestamp biar unik)
            const cleanFilename = filename
                .replace(/\s/g, '_')
                .replace(/[^a-zA-Z0-9._-]/g, '');
            const timestamp = new Date().getTime();
            link.download = `reels_${timestamp}_${cleanFilename}`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(downloadUrl);

            setSuccessMessage('💾 Gambar berhasil di download!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            console.error('Download gagal:', err);
            setError('Gagal mendownload gambar. Coba lagi nanti.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setDownloading(null);
        }
    };

    // Download semua gambar (opsional - fitur tambahan)
    const downloadAllImages = async () => {
        if (uploadedImages.length === 0) {
            setError('Tidak ada gambar untuk didownload');
            setTimeout(() => setError(null), 2000);
            return;
        }

        setUploading(true); // reuse loading state
        let successCount = 0;

        for (const img of uploadedImages) {
            try {
                const response = await fetch(img.url);
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `reels_${img.id}_${img.filename}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);

                // Delay antar download biar browser kewalahan
                await new Promise(resolve => setTimeout(resolve, 500));
                successCount++;
            } catch (err) {
                console.error(`Gagal download ${img.filename}:`, err);
            }
        }

        setUploading(false);
        setSuccessMessage(`✅ Berhasil mendownload ${successCount} dari ${uploadedImages.length} gambar!`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const deleteImage = (id) => {
        if (window.confirm('Yakin ingin menghapus gambar ini dari daftar?')) {
            const newImages = uploadedImages.filter(img => img.id !== id);
            setUploadedImages(newImages);
            localStorage.setItem('ayanami_uploaded_images', JSON.stringify(newImages));
            setSuccessMessage('🗑️ Gambar dihapus dari daftar');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    // Format ukuran file
    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                        Bahan Reels
                    </h1>
                    <p className="text-gray-600 mt-2">Upload, kelola, dan download gambar untuk konten reel-mu</p>
                </div>

                {/* Notifikasi */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 animate-shake">
                        <div className="flex items-center">
                            <span className="text-xl mr-2">❌</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4 animate-fadeIn">
                        <div className="flex items-center">
                            <span className="text-xl mr-2">✅</span>
                            <span>{successMessage}</span>
                        </div>
                    </div>
                )}

                {/* Upload Area */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <label className="block mb-4">
                        <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
              ${uploading ? 'border-gray-300 bg-gray-50' : 'border-pink-300 hover:border-pink-500 hover:bg-pink-50'}`}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={uploading}
                                className="hidden"
                            />
                            <div className="text-4xl mb-2">
                                {uploading ? '⏳' : '📸'}
                            </div>
                            <p className="text-gray-600">
                                {uploading ? 'Uploading...' : 'Klik atau drag & drop gambar di sini'}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">Support JPG, PNG, GIF, WEBP (Max 200MB)</p>
                        </div>
                    </label>

                    {preview && (
                        <div className="mt-4 text-center animate-fadeIn">
                            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow" />
                            <p className="text-sm text-gray-500 mt-2">Preview gambar</p>
                        </div>
                    )}
                </div>

                {/* Gallery */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h2 className="text-xl font-bold">
                            Gallery Gambar ({uploadedImages.length})
                        </h2>

                        {/* Tombol Download Semua */}
                        {uploadedImages.length > 0 && (
                            <button
                                onClick={downloadAllImages}
                                disabled={uploading}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                            >
                                <span>📦</span>
                                Download Semua ({uploadedImages.length})
                            </button>
                        )}
                    </div>

                    {uploadedImages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-6xl mb-2">🖼️</div>
                            <p>Belum ada gambar. Upload gambar pertamamu!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uploadedImages.map((img) => (
                                <div key={img.id} className="border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                                    <div className="relative group">
                                        <img
                                            src={img.url}
                                            alt={img.filename}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                // Ganti dengan placeholder yang lebih stabil
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EGambar Error%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => downloadImage(img.url, img.filename)}
                                                disabled={downloading === img.url}
                                                className="bg-white text-gray-800 p-2 rounded-full hover:bg-green-500 hover:text-white transition"
                                                title="Download"
                                            >
                                                {downloading === img.url ? '⏳' : '💾'}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(img.url)}
                                                className="bg-white text-gray-800 p-2 rounded-full hover:bg-blue-500 hover:text-white transition"
                                                title="Copy URL"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => deleteImage(img.id)}
                                                className="bg-white text-gray-800 p-2 rounded-full hover:bg-red-500 hover:text-white transition"
                                                title="Hapus dari daftar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50">
                                        <p className="text-xs text-gray-500 truncate mb-1" title={img.filename}>
                                            📄 {img.filename}
                                        </p>
                                        {img.fileSize && (
                                            <p className="text-xs text-gray-400 mb-2">
                                                📦 {formatFileSize(img.fileSize)}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyToClipboard(img.url)}
                                                className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 transition"
                                            >
                                                Copy URL
                                            </button>
                                            <button
                                                onClick={() => downloadImage(img.url, img.filename)}
                                                disabled={downloading === img.url}
                                                className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 transition disabled:opacity-50"
                                            >
                                                {downloading === img.url ? 'Loading...' : 'Download'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
                    <p className="font-semibold mb-2">ℹ️ Info & Fitur:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>✅ Upload gambar (max 200MB) - pakai Ayanami.app</li>
                        <li>💾 Download gambar satu per satu atau sekaligus</li>
                        <li>📋 Copy link gambar untuk dibagikan</li>
                        <li>💾 Data tersimpan di localStorage browser</li>
                        <li>🔗 Link gambar permanen dan bisa diakses publik</li>
                    </ul>
                </div>
            </div>

            {/* Tambahan CSS Animations */}
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
}