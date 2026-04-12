// GenerateQuotes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function GenerateQuotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // State untuk preview
  const [previewQuote, setPreviewQuote] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    fetchCard();
  }, [id]);

  const fetchCard = async () => {
    try {
      const docRef = doc(db, 'quotes_cards', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCard({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert('Card tidak ditemukan');
        navigate('/quotes-vid');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomThumbnail = (usedIndexes = []) => {
    const availableThumbnails = [];
    for (let i = 1; i <= 15; i++) {
      const paddedNum = i.toString().padStart(3, '0');
      availableThumbnails.push(`/thumbnail/${paddedNum}.jpg`);
    }

    const unused = availableThumbnails.filter((_, idx) => !usedIndexes.includes(idx));

    if (unused.length === 0) {
      const randomIndex = Math.floor(Math.random() * availableThumbnails.length);
      return { thumbnail: availableThumbnails[randomIndex], usedIndex: randomIndex };
    }

    const randomIndexInUnused = Math.floor(Math.random() * unused.length);
    const selectedThumb = unused[randomIndexInUnused];
    const originalIndex = availableThumbnails.findIndex(t => t === selectedThumb);

    return { thumbnail: selectedThumb, usedIndex: originalIndex };
  };

  const wrapText = (ctx, text, maxWidth, fontSize) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const drawTextOnImage = (img, quote, index, total) => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not found'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not found'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // FIX: Gunakan ukuran font yang sama untuk semua
      const fontSize = 28; // Ukuran tetap

      // FIX: Perbesar padding biar teks MUDAH wrap
      const horizontalPadding = 110; // Perbesar jadi 60px agar teks lebih sempit dan wrap

      const maxWidth = canvas.width - (horizontalPadding * 2);

      console.log(`Canvas width: ${canvas.width}, MaxWidth: ${maxWidth}, Quote length: ${quote.length}`);

      ctx.font = `${fontSize}px "Arial", "Helvetica", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.textAlign = 'center';

      // Ini akan wrap otomatis karena maxWidth lebih kecil
      const lines = wrapText(ctx, quote, maxWidth, fontSize);
      const lineHeight = fontSize * 1.3; // Tambah sedikit biar lega

      console.log(`Jumlah baris: ${lines.length}`);
      lines.forEach((line, idx) => {
        console.log(`Baris ${idx + 1}: ${line}`);
      });

      const totalTextHeight = lines.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2;

      lines.forEach((line, idx) => {
        const yPos = startY + (idx * lineHeight);
        ctx.fillText(line, canvas.width / 2, yPos);
      });

      ctx.font = `12px "Arial", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(`${index + 1}/${total}`, canvas.width - 25, canvas.height - 15);

      resolve(canvas.toDataURL('image/png'));
    });
  };

  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  // Fungsi untuk preview satu quote
  const handlePreview = async (quote, index) => {
    if (!canvasRef.current || !quote) return;

    setPreviewLoading(true);
    setPreviewQuote(quote);
    setShowPreview(true);

    try {
      const { thumbnail } = getRandomThumbnail([]);

      const img = new Image();
      img.crossOrigin = 'Anonymous';

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout loading thumbnail')), 10000);

        img.onload = async () => {
          clearTimeout(timeout);
          try {
            const dataUrl = await drawTextOnImage(img, quote, index + 1, card.quotes.length);
            setPreviewImage(dataUrl);
            setPreviewLoading(false);
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          img.src = '/thumbnail/001.jpg';
        };

        img.src = thumbnail;
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewLoading(false);
      alert('Gagal membuat preview');
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
    setPreviewQuote(null);
    setPreviewLoading(false);
  };

  const handleGenerateAll = async () => {
    if (!card || !card.quotes) {
      alert('Data card tidak valid');
      return;
    }

    if (!canvasRef.current) {
      alert('Canvas tidak siap, coba refresh halaman');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    const quotes = card.quotes;
    const total = quotes.length;
    const usedThumbnails = [];

    try {
      for (let i = 0; i < total; i++) {
        const { thumbnail, usedIndex } = getRandomThumbnail(usedThumbnails);
        usedThumbnails.push(usedIndex);

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading thumbnail: ${thumbnail}`));
          }, 10000);

          img.onload = async () => {
            clearTimeout(timeout);
            try {
              // FIX: Hapus parameter uniformFontSize, biar drawTextOnImage yang handle
              const dataUrl = await drawTextOnImage(img, quotes[i], i + 1, total);
              const filename = `${card.title || 'quote'}_${(i + 1).toString().padStart(2, '0')}.png`;
              downloadImage(dataUrl, filename);
              setDownloadProgress(i + 1);
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          img.onerror = () => {
            clearTimeout(timeout);
            console.error(`Gagal load thumbnail: ${thumbnail}`);
            img.src = '/thumbnail/001.jpg';
          };

          img.src = thumbnail;
        });

        await new Promise(r => setTimeout(r, 300));
      }

      alert(`✅ Berhasil download ${total} gambar!\nUkuran font: 28px (konsisten)\nPadding: 60px (agar teks wrap ke 2-3 baris)`);
    } catch (error) {
      console.error('Error saat generate:', error);
      alert(`❌ Gagal mendownload: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="text-center">
        <i className="ri-loader-4-line text-4xl animate-spin" style={{ color: '#355485' }}></i>
        <p className="mt-2" style={{ color: '#6b7280' }}>Memuat data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 shadow-sm" style={{ backgroundColor: '#355485' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotes-vid')}
            className="text-white p-1 active:scale-95 transition-transform"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Generate Images</h1>
            <p className="text-xs text-white opacity-80 mt-0.5">{card?.title}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-full">
        <div className="rounded-xl overflow-hidden shadow-sm mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#cbdde9' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base break-words" style={{ color: '#355485' }}>
                  <i className="ri-file-text-line mr-2"></i>
                  {card.title || 'Quotes Card'}
                </h2>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  <i className="ri-double-quotes-l"></i> {card.quotes?.length} kalimat
                </p>
              </div>
              <div className="text-3xl opacity-30">
                <i className="ri-double-quotes-r"></i>
              </div>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {card.quotes?.map((quote, idx) => (
              <div key={idx} className="mb-3 p-3 rounded-lg transition-all active:scale-[0.99]" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div className="flex items-start gap-3">
                  <span className="font-bold text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#4f90c6', color: 'white' }}>
                    {idx + 1}
                  </span>
                  <p className="text-sm flex-1 break-words leading-relaxed" style={{ color: '#355485' }}>{quote}</p>
                  <button
                    onClick={() => handlePreview(quote, idx)}
                    className="flex-shrink-0 px-2 py-1 rounded text-xs transition-all active:scale-95"
                    style={{ backgroundColor: '#35548520', color: '#355485' }}
                  >
                    <i className="ri-eye-line mr-1"></i>
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {downloading && (
          <div className="mb-4 p-4 rounded-xl animate-pulse" style={{ backgroundColor: '#cbdde9' }}>
            <div className="flex justify-between text-sm mb-2" style={{ color: '#355485' }}>
              <span className="flex items-center gap-2">
                <i className="ri-download-cloud-line animate-bounce"></i>
                Mendownload...
              </span>
              <span className="font-semibold">{downloadProgress} / {card.quotes?.length}</span>
            </div>
            <div className="rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#90b6d5' }}>
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{ width: `${(downloadProgress / card.quotes.length) * 100}%`, backgroundColor: '#355485' }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateAll}
          disabled={downloading}
          className="w-full py-4 rounded-xl font-semibold text-white transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:active:scale-100"
          style={{ backgroundColor: downloading ? '#90b6d5' : '#4f90c6' }}
        >
          <i className={`${downloading ? 'ri-loader-4-line animate-spin' : 'ri-download-cloud-2-line'} mr-2 text-xl align-middle`}></i>
          {downloading ? 'Memproses...' : `Download Semua (${card.quotes?.length} Gambar)`}
        </button>

        <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: '#cbdde9', color: '#355485' }}>
          <i className="ri-information-line mr-1"></i>
          <div className="space-y-1">
            <p>• Klik Preview untuk melihat hasil sebelum download</p>
            <p>• Font: Arial ukuran 24px (konsisten untuk semua gambar)</p>
            <p>• Margin kiri-kanan: 25px | Jarak baris: 1.25x</p>
            <p>• Setiap gambar menggunakan thumbnail berbeda dari 15 gambar</p>
          </div>
        </div>
      </div>

      {/* Modal Preview */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
          onClick={closePreview}
        >
          <div
            className="relative max-w-[95%] max-h-[95%] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {previewLoading ? (
              <div className="flex items-center justify-center min-w-[300px] min-h-[400px]" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="text-center">
                  <i className="ri-loader-4-line text-4xl animate-spin" style={{ color: '#4f90c6' }}></i>
                  <p className="mt-2 text-white text-sm">Generating preview...</p>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                  <p className="text-white text-sm text-center break-words px-4">
                    {previewQuote?.length > 100 ? previewQuote.substring(0, 100) + '...' : previewQuote}
                  </p>
                </div>
              </>
            )}

            {/* Tombol close */}
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              <i className="ri-close-line text-xl"></i>
            </button>

            {/* Tombol download preview */}
            {!previewLoading && previewImage && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `preview_${Date.now()}.png`;
                  link.href = previewImage;
                  link.click();
                }}
                className="absolute bottom-20 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{ backgroundColor: '#4f90c6', color: 'white' }}
              >
                <i className="ri-download-line text-xl"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}
      />
    </div>
  );
}