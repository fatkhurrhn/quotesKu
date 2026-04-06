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

/* ---------- Main Component ---------- */
export default function Saluran() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingTextId, setSharingTextId] = useState(null);

  // State untuk tracking status "tandai" per quote
  const [markStatus, setMarkStatus] = useState({});

  // Load mark status dari localStorage saat mount
  useEffect(() => {
    const savedMarkStatus = localStorage.getItem("quoteMarkStatusAll");
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
    localStorage.setItem("quoteMarkStatusAll", JSON.stringify(newStatus));
  };

  // Toggle mark status
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
        const approved = data.filter((quote) => quote.status === "approved");

        // Acak urutan quotes
        const shuffledQuotes = shuffleArray(approved);

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

  // filter search
  useEffect(() => {
    let filtered = [...quotes];
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (q) => q.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredQuotes(filtered);
  }, [searchTerm, quotes]);

  // share handler - TEXT ONLY
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
    return `${quotes.length} quotes`;
  };

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800">
      <BottomNav />

      {/* Header dengan Search Input */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="relative">
            <i className="ri-search-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
            <input
              type="text"
              placeholder="Cari quotes..."
              className="w-full p-2.5 pl-9 pr-8 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-base"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 pt-[72px] pb-20">
        <div className="mb-3 px-1">
          <p className="text-xs text-gray-500">{getDisplayMessage()}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                  <div className="h-4 bg-gray-200 rounded w-10/12"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
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
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md"
                  >
                    {/* Quote Text */}
                    <p className="text-gray-800 text-sm leading-relaxed mb-3">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Share Button */}
                      <button
                        onClick={() => handleShareText(q)}
                        disabled={sharingTextId === q.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 text-xs font-medium"
                      >
                        {sharingTextId === q.id ? (
                          <i className="ri-loader-4-line animate-spin text-sm"></i>
                        ) : (
                          <i className="ri-share-line text-sm"></i>
                        )}
                        <span>Bagikan</span>
                      </button>

                      {/* Mark Button */}
                      <button
                        onClick={() => toggleMarkStatus(q.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${isMarked
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        <i className={`${isMarked ? "ri-checkbox-circle-line" : "ri-circle-line"} text-sm`}></i>
                        <span>{isMarked ? "Selesai" : "Tandai"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <i className="ri-inbox-line text-5xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 text-sm">Tidak ada quote yang ditemukan</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-3 text-blue-500 hover:text-blue-600 text-xs font-medium"
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