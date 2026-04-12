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

// Fungsi untuk mengacak array (Fisher-Yates shuffle)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
export default function InstagramKu() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingImageId, setSharingImageId] = useState(null);
  const [markStatus, setMarkStatus] = useState({});
  const [copiedId, setCopiedId] = useState(null); // State untuk tracking quote yang di-copy

  useEffect(() => {
    const savedMarkStatus = localStorage.getItem("quoteMarkStatus");
    if (savedMarkStatus) {
      setMarkStatus(JSON.parse(savedMarkStatus));
    }
  }, []);

  const saveMarkStatus = (quoteId, status) => {
    const newStatus = { ...markStatus, [quoteId]: status };
    setMarkStatus(newStatus);
    localStorage.setItem("quoteMarkStatus", JSON.stringify(newStatus));
  };

  const toggleMarkStatus = (quoteId) => {
    const currentStatus = markStatus[quoteId] || false;
    saveMarkStatus(quoteId, !currentStatus);
  };

  // Fungsi untuk copy teks quote
  const handleCopyQuote = async (quote, author, quoteId) => {
    try {
      const copyText = `"${quote}"\n-${author}`;
      await navigator.clipboard.writeText(copyText);

      // Set ID yang sedang di-copy
      setCopiedId(quoteId);

      // Reset setelah 2 detik
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error("Gagal copy teks:", err);
      alert("Gagal menyalin quote");
    }
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const q = query(myQuotesCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const approved = data.filter((q) => q.status === "approved");

        // Ambil quotes dari fatkhurrhn dan storythur
        const targetQuotes = approved.filter(
          (quote) =>
            quote.author?.toLowerCase() === "fatkhurrhn" ||
            quote.author?.toLowerCase() === "storythur"
        );

        // Acak urutan quotes
        const shuffledQuotes = shuffleArray(targetQuotes);

        setQuotes(shuffledQuotes);
        setFilteredQuotes(shuffledQuotes);
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
    return `${quotes.length} quotes dari Fatkhurrhn & Storythur`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      <BottomNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2a436c] to-[#355485] pt-10 pb-8 rounded-b-3xl shadow-md">
        <div className="max-w-lg mx-auto px-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Kata Hari Ini</h1>
            <p className="text-[#cbdde9] text-xs">Kumpulan quotes dari Fatkhurrhn & Storythur</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-lg mx-auto px-5 -mt-5 mb-4">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
          <input
            type="text"
            placeholder="Cari quotes..."
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
                const isCopied = copiedId === q.id;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-all"
                  >
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-2 pb-2 border-b border-[#e5e7eb]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#cbdde9] rounded-lg flex items-center justify-center">
                          {q.author?.toLowerCase() === "fatkhurrhn" ? (
                            <i className="ri-graduation-cap-line text-[#355485] text-xs"></i>
                          ) : (
                            <i className="ri-book-open-line text-[#355485] text-xs"></i>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#355485]">
                          {q.author}
                        </h3>
                      </div>
                      {/* Copy Button with clipboard icon */}
                      <button
                        onClick={() => handleCopyQuote(q.text, q.author, q.id)}
                        className="transition-all duration-200 hover:scale-110"
                      >
                        <i className={`${isCopied ? "ri-clipboard-fill" : "ri-clipboard-line"} text-[#9ca3af] text-lg hover:text-[#355485]`}></i>
                      </button>
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
                <p className="text-[#6b7280] text-sm">Tidak ada quote yang tersedia</p>
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