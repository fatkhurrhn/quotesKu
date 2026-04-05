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

const getCategoryLabel = (cat) => {
  switch (cat) {
    case "motivation": return "motivasi";
    case "life":
    case "wisdom": return "reminder";
    case "love": return "cinta";
    case "funny": return "lucu";
    default: return "lainnya";
  }
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

const generateQuoteImage = async (quote, author, category) => {
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
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [sharingImageId, setSharingImageId] = useState(null);
  const [sharingTextId, setSharingTextId] = useState(null);

  // State untuk tracking status "tandai" per quote (alternating between check and check-double)
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

  // Toggle mark status (alternates between 0, 1, 2, ...)
  const toggleMarkStatus = (quoteId) => {
    const currentStatus = markStatus[quoteId] || 0;
    // Cycle through: 0 -> 1 -> 2 -> 0 -> ...
    const nextStatus = (currentStatus + 1) % 3;
    saveMarkStatus(quoteId, nextStatus);
  };

  // Get icon based on mark status
  const getMarkIcon = (status) => {
    if (status === 0) return "ri-check-line";
    if (status === 1) return "ri-check-double-line";
    return "ri-checkbox-circle-line"; // for status 2 or more
  };

  // Get text based on mark status
  const getMarkText = (status) => {
    if (status === 0) return "Tandai";
    if (status === 1) return "Selesai";
    return "Selesai +"; // for status 2 or more
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

  // filter search + kategori
  useEffect(() => {
    let filtered = [...quotes];
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (q) =>
          q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((q) => q.category === selectedCategory);
    }
    setFilteredQuotes(filtered);
  }, [searchTerm, selectedCategory, quotes]);

  // share handler - IMAGE version
  const handleShareImage = async (q) => {
    setSharingImageId(q.id);
    try {
      const dataUrl = await generateQuoteImage(q.text, q.author, q.category);

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
      const shareText = `"${q.text}" — ${q.author}`;

      // Cek apakah browser support Web Share API
      if (navigator.share) {
        await navigator.share({
          title: "Quote",
          text: shareText,
        });
      } else {
        // Fallback: copy ke clipboard
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
    if ((searchTerm || selectedCategory !== "all") && filteredQuotes.length === 0) {
      return "Tidak ada quote yang ditemukan";
    }
    if (searchTerm || selectedCategory !== "all") {
      return `Menampilkan ${filteredQuotes.length} dari ${quotes.length} quotes`;
    }
    return `Total ${quotes.length} quotes tersedia`;
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowFilterDropdown(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <BottomAdd />

      {/* Header Fixed dengan Search Input dan Filter Dropdown */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Search Input - full width dengan icon */}
            <div className="flex-1 relative">
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

            {/* Filter Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-[#355485] text-white rounded-lg hover:bg-[#2a4368] transition-colors"
              >
                <i className="ri-equalizer-line text-lg"></i>
                <span className="text-sm font-medium">Filter</span>
                <i className={`ri-arrow-down-s-line text-lg transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Dropdown Menu */}
              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilterDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <button
                      onClick={() => handleCategorySelect("all")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCategory === "all" ? "bg-[#355485] text-white" : "text-gray-700"}`}
                    >
                      Semua Kategori
                    </button>
                    <button
                      onClick={() => handleCategorySelect("motivation")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCategory === "motivation" ? "bg-[#355485] text-white" : "text-gray-700"}`}
                    >
                      Motivasi
                    </button>
                    <button
                      onClick={() => handleCategorySelect("life")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCategory === "life" ? "bg-[#355485] text-white" : "text-gray-700"}`}
                    >
                      Reminder
                    </button>
                    <button
                      onClick={() => handleCategorySelect("love")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCategory === "love" ? "bg-[#355485] text-white" : "text-gray-700"}`}
                    >
                      Cinta
                    </button>
                    <button
                      onClick={() => handleCategorySelect("funny")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCategory === "funny" ? "bg-[#355485] text-white" : "text-gray-700"}`}
                    >
                      Lucu
                    </button>
                    <button
                      onClick={() => handleCategorySelect("other")}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${selectedCategory === "other" ? "bg-[#355485] text-white" : "text-gray-700"}`}
                    >
                      Lainnya
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Filter Indicator */}
          {selectedCategory !== "all" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-600">Filter aktif:</span>
              <button
                onClick={() => handleCategorySelect("all")}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#355485] bg-opacity-10 text-[#355485] rounded-md text-xs"
              >
                {getCategoryLabel(selectedCategory)}
                <i className="ri-close-line text-xs"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-[100px] pb-10">
        <div className="px-1 mt-3 mb-2">
          <div className="text-sm text-gray-500 mb-2">{getDisplayMessage()}</div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="relative flex gap-4 px-1 mt-4 border-b mb-3 border-gray-200 pb-4">
                <div className="flex-shrink-0 mr-[-4px]">
                  <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse"></div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>

                  <div className="mt-2 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => {
                const markStatusValue = markStatus[q.id] || 0;
                return (
                  <div
                    key={q.id}
                    className="relative flex gap-4 px-1 mt-4 border-b mb-3 border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors pb-2"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[14px] font-semibold text-gray-800 leading-tight mb-[-5px]">
                            {highlightText(q.author, searchTerm)}
                          </p>
                          <span className="text-[12px] text-gray-500">
                            #{getCategoryLabel(q.category)}
                          </span>
                        </div>
                        {/* Teks waktu relatif dalam Bahasa Indonesia */}
                        <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">
                          {getRelativeTime(q.createdAt)}
                        </span>
                      </div>

                      <p className="text-gray-800 mr-1 text-[15px] leading-relaxed mb-2">
                        {highlightText(q.text, searchTerm)}
                      </p>

                      <div className="flex items-center justify-between mt-1 mb-2 flex-wrap gap-2">
                        {/* Tombol share dan tandai */}
                        <div className="flex items-center gap-2 text-gray-500 text-[14px] flex-wrap">
                          {/* Share Image Button */}
                          <button
                            onClick={() => handleShareImage(q)}
                            disabled={sharingImageId === q.id}
                            className="flex items-center gap-1 hover:text-purple-600 transition-colors text-xs"
                          >
                            {sharingImageId === q.id ? (
                              <i className="ri-loader-4-line animate-spin"></i>
                            ) : (
                              <i className="ri-image-line"></i>
                            )}
                            <span>bagikan gambar</span>
                          </button>

                          {/* Share Text Only Button */}
                          <button
                            onClick={() => handleShareText(q)}
                            disabled={sharingTextId === q.id}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors text-xs"
                          >
                            {sharingTextId === q.id ? (
                              <i className="ri-loader-4-line animate-spin"></i>
                            ) : (
                              <i className="ri-file-text-line"></i>
                            )}
                            <span>bagikan teks</span>
                          </button>

                          {/* Tombol Tandai dengan icon alternating */}
                          <button
                            onClick={() => toggleMarkStatus(q.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${markStatusValue > 0
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-gray-100 text-gray-600 border border-gray-300"
                              }`}
                          >
                            <i className={`${getMarkIcon(markStatusValue)} text-sm`}></i>
                            <span className="text-xs font-medium whitespace-nowrap">
                              {getMarkText(markStatusValue)}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">Tidak ada quote</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}