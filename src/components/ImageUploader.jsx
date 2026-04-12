import React, { useState } from 'react';
import { uploadImageToImgBB } from '../services/imgbbService';

export default function ImageUploader({ onUploadSuccess, onUploadError }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // Upload file
        setUploading(true);
        setUploadProgress(0);

        // Simulate progress (ImgBB doesn't provide progress)
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        const result = await uploadImageToImgBB(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.success) {
            if (onUploadSuccess) {
                onUploadSuccess(result.data);
            }
            // Clear preview after 2 seconds
            setTimeout(() => {
                setPreview(null);
                setUploadProgress(0);
            }, 2000);
        } else {
            if (onUploadError) {
                onUploadError(result.error);
            }
            // Clear preview on error
            setPreview(null);
            setUploadProgress(0);
        }

        setUploading(false);
    };

    return (
        <div className="image-uploader p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="w-full cursor-pointer"
            />

            {preview && (
                <div className="mt-4">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full h-auto rounded-lg shadow-md"
                        style={{ maxHeight: '200px' }}
                    />
                </div>
            )}

            {uploading && (
                <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                        Uploading... {uploadProgress}%
                    </p>
                </div>
            )}
        </div>
    );
}