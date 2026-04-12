import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, where } from "firebase/firestore";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [totalAuthors, setTotalAuthors] = useState(0);
  const [quoteOfDay, setQuoteOfDay] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch realtime data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(myQuotesCollection, where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        const quotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setTotalQuotes(quotes.length);

        const uniqueAuthors = [...new Set(quotes.map(q => q.author).filter(a => a))];
        setTotalAuthors(uniqueAuthors.length);

        if (quotes.length > 0) {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          setQuoteOfDay(quotes[randomIndex]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleContact = () => {
    const message = encodeURIComponent("Halo min, aku mau kasi saran nih untuk aplikasi quotesKu...");
    window.open(`https://www.instagram.com/direct/t/106594434391160/${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      <BottomNav />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#1e3a5f] via-[#2a436c] to-[#355485] pt-12 pb-20 rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative max-w-lg mx-auto px-5 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <i className="ri-sparkling-line text-white text-xs"></i>
            <span className="text-white/90 text-[11px] font-medium">Inspirasi Setiap Hari</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">quotesKu</h1>
          <p className="text-[#cbdde9] text-sm mb-8">Temukan inspirasi dalam setiap kata</p>

          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg group-focus-within:text-[#355485] transition"></i>
              <input
                type="text"
                placeholder="Cari quotes... contoh: cinta, sukses"
                className="w-full p-3.5 pl-11 pr-28 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#4f90c6] text-sm shadow-lg transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#355485] to-[#4f90c6] text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:shadow-md transition-all"
              >
                Cari
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["inspirasi", "cinta", "sukses", "motivasi", "kuliah"].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row - OVERLAPPING with higher z-index */}
      <div className="relative max-w-lg mx-auto px-5 -mt-8 z-20">
        <div className="grid grid-cols-4 gap-3 bg-white rounded-2xl p-4 shadow-xl border border-[#e5e7eb]">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#355485] to-[#4f90c6] bg-clip-text text-transparent">
              {loading ? "..." : totalQuotes}+
            </div>
            <div className="text-[10px] text-[#6b7280] mt-1 font-medium">Quotes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#355485] to-[#4f90c6] bg-clip-text text-transparent">
              {loading ? "..." : totalAuthors}
            </div>
            <div className="text-[10px] text-[#6b7280] mt-1 font-medium">Penulis</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#355485] to-[#4f90c6] bg-clip-text text-transparent">
              Gratis
            </div>
            <div className="text-[10px] text-[#6b7280] mt-1 font-medium">Selamanya</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#355485] to-[#4f90c6] bg-clip-text text-transparent">
              24/7
            </div>
            <div className="text-[10px] text-[#6b7280] mt-1 font-medium">Akses</div>
          </div>
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="max-w-lg mx-auto px-5 mt-6 mb-8">
        <div className="relative bg-gradient-to-r from-[#1e3a5f] via-[#2a436c] to-[#355485] rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <i className="ri-double-quotes-r text-8xl text-white"></i>
          </div>
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <i className="ri-sparkling-line text-[#cbdde9] text-sm"></i>
              <span className="text-[#cbdde9] text-[11px] font-semibold tracking-wide">QUOTE HARI INI</span>
              <i className="ri-sparkling-line text-[#cbdde9] text-sm"></i>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-white/20 rounded-lg"></div>
                <div className="h-4 bg-white/20 rounded w-32 mx-auto"></div>
              </div>
            ) : quoteOfDay ? (
              <>
                <p className="text-white text-base leading-relaxed text-center mb-4">
                  "{quoteOfDay.text}"
                </p>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    <i className="ri-user-line text-[#cbdde9] text-xs"></i>
                    <span className="text-[#cbdde9] text-xs font-medium">— {quoteOfDay.author}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-white/70 text-sm text-center">Belum ada quote tersedia</p>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-lg mx-auto px-5 mb-10">
        <div className="text-center mb-6">
          <h2 className="font-bold text-gray-800 text-xl">✨ Fitur Unggulan</h2>
          <p className="text-[#6b7280] text-xs mt-1">Semua yang kamu butuhkan dalam satu aplikasi</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: "ri-search-line", name: "Cari", color: "from-blue-400 to-blue-600" },
            { icon: "ri-shuffle-line", name: "Acak", color: "from-purple-400 to-purple-600" },
            { icon: "ri-share-line", name: "Bagikan", color: "from-green-400 to-green-600" },
            { icon: "ri-heart-line", name: "Like", color: "from-red-400 to-red-600" }
          ].map((feature, idx) => (
            <div key={idx} className="group bg-white rounded-xl p-3 text-center shadow-sm border border-[#e5e7eb] hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition`}>
                <i className={`${feature.icon} text-white text-lg`}></i>
              </div>
              <span className="text-[11px] font-medium text-gray-700">{feature.name}</span>
            </div>
          ))}
        </div>
      </div>

      

      {/* Tentang Aplikasi & Developer */}
      <div className="max-w-lg mx-auto px-5 mb-10">
        <div className="bg-gradient-to-r from-[#f0f4f8] to-[#e8eef5] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#355485] to-[#4f90c6] rounded-xl flex items-center justify-center">
              <i className="ri-information-line text-white text-lg"></i>
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Tentang quotesKu</h2>
              <p className="text-[#6b7280] text-[10px]">Platform berbagi inspirasi</p>
            </div>
          </div>
          <p className="text-[#6b7280] text-sm leading-relaxed mb-4">
            quotesKu adalah platform kumpulan quotes inspiratif dari berbagai penulis.
            Temukan, bagikan, dan tandai quotes favoritmu untuk menemukan semangat setiap hari.
          </p>

          <div className="border-t border-[#cbdde9] pt-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-code-line text-[#355485] text-sm"></i>
                <span className="text-xs text-gray-600">Developer: <span className="font-semibold text-[#355485]">Fatkhurrhn</span></span>
              </div>
              <button
                onClick={handleContact}
                className="flex items-center gap-1.5 bg-[#355485] hover:bg-[#2a436c] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                <i className="ri-instagram-line text-sm"></i>
                <span>DM Saran</span>
              </button>
            </div>
            <p className="text-[10px] text-[#6b7280] mt-2">
              Ada saran atau masukan? Klik tombol di atas untuk langsung DM ke Instagram developer
            </p>
          </div>
        </div>
      </div>

      
    </div>
  );
}