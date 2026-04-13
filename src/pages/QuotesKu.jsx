import { useState, useEffect } from "react";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, orderBy, doc, updateDoc, increment } from "firebase/firestore";
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

// Fungsi untuk menghitung waktu relatif
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

// Author yang di-hide dari tampilan default
const HIDDEN_AUTHORS = ["storythur", "fatkhurrhn", "nrltfh_22", "motivasi_quran"];

/* ---------- Main Component ---------- */
export default function QuotesKu() {
  const [allQuotes, setAllQuotes] = useState([]);
  const [displayQuotes, setDisplayQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharingTextId, setSharingTextId] = useState(null);
  const [markStatus, setMarkStatus] = useState({});
  const [quoteStates, setQuoteStates] = useState({});
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [copyNotificationId, setCopyNotificationId] = useState(null);

  // Load mark status dari localStorage
  useEffect(() => {
    const savedMarkStatus = localStorage.getItem("quoteMarkStatusSaluran");
    if (savedMarkStatus) {
      setMarkStatus(JSON.parse(savedMarkStatus));
    }
  }, []);

  // Save mark status ke localStorage
  const saveMarkStatus = (quoteId, status) => {
    const newStatus = { ...markStatus, [quoteId]: status };
    setMarkStatus(newStatus);
    localStorage.setItem("quoteMarkStatusSaluran", JSON.stringify(newStatus));
  };

  // Toggle mark status
  const toggleMarkStatus = (quoteId) => {
    const currentStatus = markStatus[quoteId] || false;
    saveMarkStatus(quoteId, !currentStatus);
  };

  // Like handler
  const handleLike = async (id, currentLikes, currentLikeStatus) => {
    setQuoteStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isLiking: true,
        isLiked: !currentLikeStatus,
        likesCount: currentLikeStatus ? currentLikes - 1 : currentLikes + 1
      }
    }));

    try {
      const ref = doc(myQuotesCollection, id);
      await updateDoc(ref, { likes: increment(currentLikeStatus ? -1 : 1) });
    } catch (err) {
      console.error("Error like:", err);
      setQuoteStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isLiked: currentLikeStatus,
          likesCount: currentLikes
        }
      }));
    } finally {
      setQuoteStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], isLiking: false }
      }));
    }
  };

  // Share handler - NATIVE SHARE
  const handleShareText = async (q) => {
    setSharingTextId(q.id);
    try {
      const shareText = `"${q.text}"\n-${q.author}`;

      if (navigator.share) {
        await navigator.share({
          title: "Quote",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Share tidak support di browser ini, teks sudah disalin ke clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
        alert("Gagal membagikan quote, silakan coba lagi");
      }
    } finally {
      setSharingTextId(null);
    }
  };

  // Copy text handler
  const handleCopyText = async (q) => {
    try {
      const copyText = `"${q.text}"\n-${q.author}`;
      await navigator.clipboard.writeText(copyText);

      setCopyNotificationId(q.id);

      setTimeout(() => {
        setCopyNotificationId(null);
      }, 2000);
    } catch (err) {
      console.error("Error copying:", err);
      alert("Gagal menyalin quote");
    }
  };

  // Filter by author
  const filterByAuthor = (author) => {
    if (selectedAuthor === author) {
      setSelectedAuthor(null);
      // Reset ke display quotes default (tanpa hidden authors)
      const defaultQuotes = allQuotes.filter(
        (quote) => !HIDDEN_AUTHORS.includes(quote.author?.toLowerCase())
      );
      setDisplayQuotes(defaultQuotes);
      // Reset search term juga
      setSearchTerm("");
      setFilteredQuotes(defaultQuotes);
    } else {
      setSelectedAuthor(author);
      // Filter quotes dari author yang dipilih (dari allQuotes)
      const filtered = allQuotes.filter(q => q.author === author);
      setDisplayQuotes(filtered);
      // Reset search term
      setSearchTerm("");
      setFilteredQuotes(filtered);
    }
  };

  // Search handler - SEARCH INDEPENDENT, mencari di SEMUA quotes (allQuotes)
  const handleSearch = (keyword) => {
    if (keyword.trim()) {
      // Search dari ALL QUOTES (termasuk hidden authors)
      const searchResults = allQuotes.filter(
        (q) => q.text.toLowerCase().includes(keyword.toLowerCase())
      );
      setFilteredQuotes(searchResults);
      // Clear selected author karena search independen
      setSelectedAuthor(null);
    } else {
      // Jika search kosong, kembali ke tampilan default (tanpa hidden authors)
      const defaultQuotes = allQuotes.filter(
        (quote) => !HIDDEN_AUTHORS.includes(quote.author?.toLowerCase())
      );
      setFilteredQuotes(defaultQuotes);
      setDisplayQuotes(defaultQuotes);
    }
  };

  // Handle search input change
  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    // Reset ke tampilan default
    const defaultQuotes = allQuotes.filter(
      (quote) => !HIDDEN_AUTHORS.includes(quote.author?.toLowerCase())
    );
    setFilteredQuotes(defaultQuotes);
    setDisplayQuotes(defaultQuotes);
    setSelectedAuthor(null);
  };

  // fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const q = query(myQuotesCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || 0
        }));
        const approved = data.filter((quote) => quote.status === "approved");

        // Simpan semua quotes yang approved
        setAllQuotes(approved);

        // Filter untuk tampilan default (exclude hidden authors)
        const defaultQuotes = approved.filter(
          (quote) => !HIDDEN_AUTHORS.includes(quote.author?.toLowerCase())
        );

        // Set initial states untuk likes
        const initialStates = {};
        approved.forEach(quote => {
          initialStates[quote.id] = {
            isLiked: false,
            isLiking: false,
            likesCount: quote.likes || 0
          };
        });
        setQuoteStates(initialStates);

        // Extract unique authors dari SEMUA quotes
        const uniqueAuthors = [...new Set(approved.map(q => q.author).filter(a => a))];
        setAuthors(uniqueAuthors);

        setDisplayQuotes(defaultQuotes);
        setFilteredQuotes(defaultQuotes);
      } catch (err) {
        console.error("Error fetch quotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  const getDisplayMessage = () => {
    if (loading) return "Memuat quotes...";
    if (searchTerm && filteredQuotes.length === 0) {
      return `Tidak ada quote yang mengandung kata "${searchTerm}"`;
    }
    if (searchTerm) {
      return `Menampilkan ${filteredQuotes.length} hasil untuk "${searchTerm}"`;
    }
    if (selectedAuthor) {
      return `Menampilkan quotes dari ${selectedAuthor}`;
    }
    return `${displayQuotes.length} quotes dari berbagai penulis`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      <BottomNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2a436c] to-[#355485] pt-10 pb-8 rounded-b-3xl shadow-md">
        <div className="max-w-lg mx-auto px-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">QuotesKu</h1>
            <p className="text-[#cbdde9] text-xs">Kumpulan quotes dari berbagai penulis</p>
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
            onChange={onSearchChange}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-gray-600"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          )}
        </div>
      </div>

      {/* Authors Filter - Hanya muncul jika tidak sedang search */}
      {!searchTerm && (
        <div className="max-w-lg mx-auto px-5 mt-3 mb-1">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => {
                setSelectedAuthor(null);
                const defaultQuotes = allQuotes.filter(
                  (quote) => !HIDDEN_AUTHORS.includes(quote.author?.toLowerCase())
                );
                setDisplayQuotes(defaultQuotes);
                setFilteredQuotes(defaultQuotes);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${!selectedAuthor
                ? "bg-[#355485] text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              Semua
            </button>
            {authors.map((author) => (
              <button
                key={author}
                onClick={() => filterByAuthor(author)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedAuthor === author
                  ? "bg-[#355485] text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                @{author}
              </button>
            ))}
          </div>
        </div>
      )}

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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
                <div className="flex gap-4 mt-3">
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((q) => {
                const isMarked = markStatus[q.id] || false;
                const state = quoteStates[q.id] || { isLiked: false, isLiking: false, likesCount: 0 };
                const showCopyNotification = copyNotificationId === q.id;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-all"
                  >
                    {/* Header Card - Instagram style */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-[#355485] to-[#4f90c6] rounded-full flex items-center justify-center">
                          <i className="ri-user-fill text-white text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {q.author}
                          </h3>
                          <p className="text-xs text-[#9ca3af]">
                            {getRelativeTime(q.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button className="text-[#9ca3af] hover:text-gray-600">
                        <i className="ri-more-2-fill text-lg"></i>
                      </button>
                    </div>

                    {/* Quote Text */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {highlightText(q.text, searchTerm)}
                    </p>

                    {/* Action Buttons - Instagram style */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-5">
                        {/* Like Button */}
                        <button
                          onClick={() => handleLike(q.id, state.likesCount, state.isLiked)}
                          disabled={state.isLiking}
                          className="flex items-center gap-1 group transition-all"
                        >
                          <i
                            className={`ri-heart-${state.isLiked ? "fill" : "line"} text-lg ${state.isLiked ? "text-red-500" : "text-gray-500 group-hover:text-red-500"
                              } transition-all`}
                          ></i>
                          <span className="text-xs text-gray-600">{state.likesCount} Suka</span>
                        </button>

                        {/* Comment Button */}
                        <button className="flex items-center gap-1 group">
                          <i className="ri-chat-3-line text-lg text-gray-500 group-hover:text-[#355485] transition-all"></i>
                          <span className="text-xs text-gray-600">Komentar</span>
                        </button>

                        {/* Share Button - NATIVE SHARE */}
                        <button
                          onClick={() => handleShareText(q)}
                          disabled={sharingTextId === q.id}
                          className="flex items-center gap-1 group"
                        >
                          {sharingTextId === q.id ? (
                            <i className="ri-loader-4-line animate-spin text-lg text-gray-500"></i>
                          ) : (
                            <i className="ri-share-forward-line text-lg text-gray-500 group-hover:text-[#355485] transition-all"></i>
                          )}
                          <span className="text-xs text-gray-600">Bagikan</span>
                        </button>
                      </div>

                      {/* Copy Button with Notification */}
                      <div className="relative">
                        <button
                          onClick={() => handleCopyText(q)}
                          className="group"
                        >
                          <i className="ri-file-copy-line text-lg text-gray-500 group-hover:text-[#355485] transition-all"></i>
                        </button>

                        {/* Copy Notification Popup */}
                        {showCopyNotification && (
                          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-green-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap animate-bounce">
                            <i className="ri-checkbox-circle-line mr-1"></i>
                            Tersalin!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-[#e5e7eb]">
                <i className="ri-inbox-line text-5xl text-[#cbdde9] mb-3"></i>
                <p className="text-[#6b7280] text-sm">
                  {searchTerm
                    ? `Tidak ada quote yang mengandung kata "${searchTerm}"`
                    : "Tidak ada quote yang ditemukan"}
                </p>
                {(searchTerm || selectedAuthor) && (
                  <button
                    onClick={clearSearch}
                    className="mt-3 text-[#4f90c6] text-xs"
                  >
                    Reset filter
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