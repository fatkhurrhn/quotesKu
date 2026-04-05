import { useState, useEffect } from "react";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, orderBy } from "firebase/firestore";
import BottomAdd from "../components/BottomAdd";

/* ---------- Helpers ---------- */
const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;
  const regex = new RegExp(`(${highlight})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200">{part}</mark>
    ) : (
      part
    )
  );
};

// Fungsi untuk menghitung waktu relatif dalam BAHASA INDONESIA
const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";

  // Konversi Firebase timestamp
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} tahun yang lalu`;
  if (diffMonths > 0) return `${diffMonths} bulan yang lalu`;
  if (diffWeeks > 0) return `${diffWeeks} minggu yang lalu`;
  if (diffDays > 0) return `${diffDays} hari yang lalu`;
  if (diffHours > 0) return `${diffHours} jam yang lalu`;
  if (diffMins > 0) return `${diffMins} menit yang lalu`;
  if (diffSecs > 10) return `${diffSecs} detik yang lalu`;
  return "baru saja";
};

const generateQuoteImage = async (quote, author) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // ukuran square
    canvas.width = 1080;
    canvas.height = 1080;

    // Pilih background berdasarkan author
    let bgImage = new Image();
    let bgUrl = "/img/bg-storythur.png"; // default

    if (author.toLowerCase() === "fatkhurrhn") {
      bgUrl = "/img/bg-fatkhurrhn.png";
    } else if (author.toLowerCase() === "storythur") {
      bgUrl = "/img/bg-storythur.png";
    }

    bgImage.crossOrigin = "Anonymous";
    bgImage.src = bgUrl;

    bgImage.onload = () => {
      // Gambar background
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      // Setting untuk teks quote
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const maxWidth = 900;
      const wrapped = wrapText(ctx, quote, maxWidth);
      const lineHeight = 70;

      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };

    bgImage.onerror = () => {
      console.error("Gagal load background image, menggunakan background putih");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "52px Arial";

      const maxWidth = 900;
      const wrapped = wrapText(ctx, quote, maxWidth);
      const lineHeight = 70;
      const totalTextHeight = wrapped.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2);

      wrapped.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
      });

      resolve(canvas.toDataURL("image/png"));
    };
  });
};

// helper wrapText
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

/* ---------- Main Component ---------- */
export default function QuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [sharingImageId, setSharingImageId] = useState(null);
  const [sharingTextId, setSharingTextId] = useState(null);

  // State untuk tracking status "tandai" per quote (true = selesai, false = tandai)
  const [markStatus, setMarkStatus] = useState({});

  // Load mark status dari localStorage saat mount
  useEffect(() => {
    const savedMarkStatus = localStorage.getItem("quoteMarkStatus");
    if (savedMarkStatus) {
      setMarkStatus(JSON.parse(savedMarkStatus));
    }
  }, []);

  // Save mark status ke localStorage
  const saveMarkStatus = (quoteId, status) => {
    const newStatus = {
      ...markStatus,
      [quoteId]: status
    };
    setMarkStatus(newStatus);
    localStorage.setItem("quoteMarkStatus", JSON.stringify(newStatus));
  };

  // Toggle mark status (alternates between false and true)
  const toggleMarkStatus = (quoteId) => {
    const currentStatus = markStatus[quoteId] || false;
    saveMarkStatus(quoteId, !currentStatus);
  };

  // fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const q = query(myQuotesCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const approved = data.filter((q) => q.status === "approved");
        setQuotes(approved);
        setFilteredQuotes(approved);
      } catch (err) {
        console.error("Error fetch quotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  // filter search
  useEffect(() => {
    let filtered = [...quotes];
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (q) =>
          q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredQuotes(filtered);
  }, [searchTerm, quotes]);

  // share handler - IMAGE version
  const handleShareImage = async (q) => {
    setSharingImageId(q.id);
    try {
      const dataUrl = await generateQuoteImage(q.text, q.author);

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "quote.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Quote",
          text: `${q.text} — ${q.author}`,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "quote.png";
        link.click();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing image:", err);
        alert("Gagal membuat gambar, silakan coba lagi");
      }
    } finally {
      setSharingImageId(null);
    }
  };

  // share handler - TEXT ONLY version
  const handleShareText = async (q) => {
    setSharingTextId(q.id);
    try {
      const shareText = q.text;

      if (navigator.share) {
        await navigator.share({
          title: "Quote",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Teks quote telah disalin ke clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing text:", err);
        alert("Gagal membagikan quote, silakan coba lagi");
      }
    } finally {
      setSharingTextId(null);
    }
  };

  const getDisplayMessage = () => {
    if (loading) return "Memuat quotes...";
    if (searchTerm && filteredQuotes.length === 0) {
      return "Tidak ada quote yang ditemukan";
    }
    if (searchTerm) {
      return `Menampilkan ${filteredQuotes.length} dari ${quotes.length} quotes`;
    }
    return `Total ${quotes.length} quotes tersedia`;
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <BottomAdd />

      {/* Header Fixed dengan Search Input */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="relative">
            <i className="ri-search-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
            <input
              type="text"
              placeholder="Cari quote atau author..."
              className="w-full p-2 pl-10 pr-8 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#355485] focus:ring-1 focus:ring-[#355485] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-[80px] pb-10">
        <div className="px-1 mt-1 mb-2">
          <div className="text-sm text-gray-500">{getDisplayMessage()}</div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => {
                const isMarked = markStatus[q.id] || false;
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          {highlightText(q.author, searchTerm)}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {getRelativeTime(q.createdAt)}
                      </span>
                    </div>

                    {/* Quote Text */}
                    <p className="text-gray-700 text-[15px] leading-relaxed mb-2">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                      {/* Share Image Button */}
                      <button
                        onClick={() => handleShareImage(q)}
                        disabled={sharingImageId === q.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 text-sm"
                      >
                        {sharingImageId === q.id ? (
                          <i className="ri-loader-4-line animate-spin text-base"></i>
                        ) : (
                          <i className="ri-image-line text-base"></i>
                        )}
                        <span>Gambar</span>
                      </button>

                      {/* Share Text Only Button */}
                      <button
                        onClick={() => handleShareText(q)}
                        disabled={sharingTextId === q.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm"
                      >
                        {sharingTextId === q.id ? (
                          <i className="ri-loader-4-line animate-spin text-base"></i>
                        ) : (
                          <i className="ri-file-text-line text-base"></i>
                        )}
                        <span>Teks</span>
                      </button>

                      {/* Mark Button - Simple toggle between Tandai and Selesai */}
                      <button
                        onClick={() => toggleMarkStatus(q.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${isMarked
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                          }`}
                      >
                        <i className={`${isMarked ? "ri-check-double-line" : "ri-check-line"} text-base`}></i>
                        <span>{isMarked ? "Selesai" : "Tandai"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <i className="ri-inbox-line text-6xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">Tidak ada quote yang ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}