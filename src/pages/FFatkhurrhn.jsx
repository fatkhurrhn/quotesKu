import { useState, useEffect } from "react";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, orderBy } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

/* ---------- Helpers ---------- */
const highlightText = (text, highlight) => {
  if (!highlight.trim()) return text;
  const regex = new RegExp(`(${highlight})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
    ) : (
      part
    )
  );
};

// Fungsi untuk menghitung waktu relatif dalam BAHASA INDONESIA
const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";

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

  if (diffYears > 0) return `${diffYears} tahun lalu`;
  if (diffMonths > 0) return `${diffMonths} bulan lalu`;
  if (diffWeeks > 0) return `${diffWeeks} minggu lalu`;
  if (diffDays > 0) return `${diffDays} hari lalu`;
  if (diffHours > 0) return `${diffHours} jam lalu`;
  if (diffMins > 0) return `${diffMins} menit lalu`;
  if (diffSecs > 10) return `${diffSecs} detik lalu`;
  return "baru saja";
};

const generateQuoteImage = async (quote, author) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1080;
    canvas.height = 1080;

    let bgImage = new Image();
    let bgUrl = "/img/bg-storythur.png";

    if (author.toLowerCase() === "fatkhurrhn") {
      bgUrl = "/img/bg-fatkhurrhn.png";
    } else if (author.toLowerCase() === "storythur") {
      bgUrl = "/img/bg-storythur.png";
    }

    bgImage.crossOrigin = "Anonymous";
    bgImage.src = bgUrl;

    bgImage.onload = () => {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

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
export default function Fatkhurrhn() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingImageId, setSharingImageId] = useState(null);
  const [markStatus, setMarkStatus] = useState({});

  useEffect(() => {
    const savedMarkStatus = localStorage.getItem("quoteMarkStatusFatkhurrhn");
    if (savedMarkStatus) {
      setMarkStatus(JSON.parse(savedMarkStatus));
    }
  }, []);

  const saveMarkStatus = (quoteId, status) => {
    const newStatus = { ...markStatus, [quoteId]: status };
    setMarkStatus(newStatus);
    localStorage.setItem("quoteMarkStatusFatkhurrhn", JSON.stringify(newStatus));
  };

  const toggleMarkStatus = (quoteId) => {
    const currentStatus = markStatus[quoteId] || false;
    saveMarkStatus(quoteId, !currentStatus);
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const q = query(myQuotesCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const approved = data.filter((q) => q.status === "approved");

        const fatkhurrhnQuotes = approved.filter(
          (quote) => quote.author?.toLowerCase() === "fatkhurrhn"
        );

        setQuotes(fatkhurrhnQuotes);
        setFilteredQuotes(fatkhurrhnQuotes);
      } catch (err) {
        console.error("Error fetch quotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  useEffect(() => {
    let filtered = [...quotes];
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (q) => q.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredQuotes(filtered);
  }, [searchTerm, quotes]);

  const handleShareImage = async (q) => {
    setSharingImageId(q.id);
    try {
      const dataUrl = await generateQuoteImage(q.text, q.author);
      const blob = await (await fetch(dataUrl)).blob();
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

  const getDisplayMessage = () => {
    if (loading) return "Memuat quotes...";
    if (searchTerm && filteredQuotes.length === 0) return "Tidak ada quote yang ditemukan";
    if (searchTerm) return `Menampilkan ${filteredQuotes.length} dari ${quotes.length} quotes`;
    return `${quotes.length} quotes dari Fatkhurrhn`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      <BottomNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2a436c] to-[#355485] pt-10 pb-8 rounded-b-3xl shadow-md">
        <div className="max-w-lg mx-auto px-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-3">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Fatkhurrhn</h1>
            <p className="text-[#cbdde9] text-xs">Kumpulan quotes khusus dunia perkuliahan</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-lg mx-auto px-5 -mt-5 mb-4">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
          <input
            type="text"
            placeholder="Cari quotes tentang perkuliahan..."
            className="w-full p-3 pl-11 rounded-xl border border-[#e5e7eb] bg-white focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-gray-600"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          )}
        </div>
      </div>

      {/* Info Count */}
      <div className="max-w-lg mx-auto px-5 mb-3">
        <p className="text-xs text-[#6b7280]">{getDisplayMessage()}</p>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
                <div className="flex gap-2 mt-3">
                  <div className="h-8 bg-gray-200 rounded-lg w-28"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
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
                    className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-all"
                  >
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-2 pb-2 border-b border-[#e5e7eb]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#cbdde9] rounded-lg flex items-center justify-center">
                          <i className="ri-graduation-cap-line text-[#355485] text-xs"></i>
                        </div>
                        <h3 className="text-sm font-semibold text-[#355485]">
                          {q.author}
                        </h3>
                      </div>
                      <span className="text-xs text-[#9ca3af]">
                        {getRelativeTime(q.createdAt)}
                      </span>
                    </div>

                    {/* Quote Text */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* Share Image Button */}
                      <button
                        onClick={() => handleShareImage(q)}
                        disabled={sharingImageId === q.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#cbdde9] text-[#355485] hover:bg-[#90b6d5] transition-all text-xs font-medium"
                      >
                        {sharingImageId === q.id ? (
                          <i className="ri-loader-4-line animate-spin text-sm"></i>
                        ) : (
                          <i className="ri-image-line text-sm"></i>
                        )}
                        <span>Posting</span>
                      </button>

                      {/* Mark Button */}
                      <button
                        onClick={() => toggleMarkStatus(q.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium ${isMarked
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        <i className={`${isMarked ? "ri-check-double-line" : "ri-check-line"} text-sm`}></i>
                        <span>{isMarked ? "Selesai" : "Tandai"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-[#e5e7eb]">
                <i className="ri-inbox-line text-5xl text-[#cbdde9] mb-3"></i>
                <p className="text-[#6b7280] text-sm">Tidak ada quote dari Fatkhurrhn</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-3 text-[#4f90c6] text-xs"
                  >
                    Hapus pencarian
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}