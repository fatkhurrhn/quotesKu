import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      <BottomNav />

      {/* Hero Section - Simple & Elegant */}
      <div className="bg-gradient-to-br from-[#355485] to-[#2a436c] pt-12 pb-16 rounded-b-3xl">
        <div className="max-w-lg mx-auto px-5 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-5">
            <span className="text-5xl">💭</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">quotesKu</h1>
          <p className="text-[#cbdde9] text-sm mb-8">Temukan inspirasi dalam setiap kata</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
              <input
                type="text"
                placeholder="Cari quotes... contoh: cinta, sukses"
                className="w-full p-3.5 pl-11 pr-24 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#90b6d5] text-sm shadow-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#355485] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#2a436c] transition"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Popular Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {["cinta", "sukses", "motivasi", "kuliah"].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-white/70 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="max-w-lg mx-auto px-5 -mt-5 mb-8">
        <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-3 shadow-sm border border-[#e5e7eb]">
          <div className="text-center">
            <div className="text-lg font-bold text-[#355485]">100+</div>
            <div className="text-[10px] text-[#6b7280]">Quotes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#355485]">2</div>
            <div className="text-[10px] text-[#6b7280]">Penulis</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#355485]">Gratis</div>
            <div className="text-[10px] text-[#6b7280]">Selamanya</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#355485]">24/7</div>
            <div className="text-[10px] text-[#6b7280]">Akses</div>
          </div>
        </div>
      </div>

      {/* Tentang */}
      <div className="max-w-lg mx-auto px-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e5e7eb]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#cbdde9] rounded-lg flex items-center justify-center">
              <i className="ri-information-line text-[#355485] text-sm"></i>
            </div>
            <h2 className="font-semibold text-[#355485]">Tentang quotesKu</h2>
          </div>
          <p className="text-[#6b7280] text-xs leading-relaxed">
            Kumpulan quotes inspiratif dari berbagai penulis. Bagikan dan tandai quotes favoritmu.
          </p>
        </div>
      </div>

      {/* Fitur */}
      <div className="max-w-lg mx-auto px-5 mb-8">
        <div className="text-center mb-4">
          <h2 className="font-semibold text-[#355485] text-lg">Fitur</h2>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#e5e7eb]">
            <div className="w-10 h-10 bg-[#cbdde9] rounded-lg flex items-center justify-center mx-auto mb-2">
              <i className="ri-search-line text-[#355485] text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-600">Cari</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#e5e7eb]">
            <div className="w-10 h-10 bg-[#cbdde9] rounded-lg flex items-center justify-center mx-auto mb-2">
              <i className="ri-shuffle-line text-[#355485] text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-600">Acak</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#e5e7eb]">
            <div className="w-10 h-10 bg-[#cbdde9] rounded-lg flex items-center justify-center mx-auto mb-2">
              <i className="ri-share-line text-[#355485] text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-600">Bagikan</span>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#e5e7eb]">
            <div className="w-10 h-10 bg-[#cbdde9] rounded-lg flex items-center justify-center mx-auto mb-2">
              <i className="ri-checkbox-circle-line text-[#355485] text-lg"></i>
            </div>
            <span className="text-[10px] text-gray-600">Tandai</span>
          </div>
        </div>
      </div>

      {/* Penulis */}
      <div className="max-w-lg mx-auto px-5 mb-8">
        <div className="text-center mb-4">
          <h2 className="font-semibold text-[#355485] text-lg">Penulis</h2>
        </div>

        <div className="space-y-3">
          <Link to="/storythur">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#355485] to-[#4f90c6] rounded-xl flex items-center justify-center text-xl">
                  📖
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Storythur</h3>
                  <p className="text-[#6b7280] text-[10px]">Quotes umum & inspiratif</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-[#4f90c6] text-xl"></i>
            </div>
          </Link>

          <Link to="/fatkhurrhn">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2a436c] to-[#355485] rounded-xl flex items-center justify-center text-xl">
                  🎓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Fatkhurrhn</h3>
                  <p className="text-[#6b7280] text-[10px]">Quotes perkuliahan</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-[#4f90c6] text-xl"></i>
            </div>
          </Link>
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="max-w-lg mx-auto px-5 mb-8">
        <div className="bg-gradient-to-r from-[#355485] to-[#4f90c6] rounded-xl p-5 shadow-md">
          <div className="text-center">
            <div className="text-[#cbdde9] text-[10px] mb-2">QUOTE HARI INI</div>
            <p className="text-white text-sm leading-relaxed mb-3">
              "Jangan pernah berhenti belajar, karena hidup tidak pernah berhenti mengajarkan."
            </p>
            <div className="text-[#cbdde9] text-xs">— Storythur</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto px-5 mb-10">
        <Link to="/quotes">
          <div className="bg-white rounded-xl p-5 text-center border border-[#e5e7eb] shadow-sm">
            <div className="w-12 h-12 bg-[#cbdde9] rounded-xl flex items-center justify-center mx-auto mb-3">
              <i className="ri-book-open-line text-[#355485] text-xl"></i>
            </div>
            <h3 className="font-semibold text-[#355485] text-sm mb-1">Lihat Semua Quotes</h3>
            <p className="text-[#6b7280] text-[10px] mb-3">Jelajahi semua quotes dari berbagai penulis</p>
            <span className="inline-block text-[#4f90c6] text-xs font-medium">Mulai Membaca →</span>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-5">
        <div className="max-w-lg mx-auto px-5 text-center">
          <p className="text-[#9ca3af] text-[10px]">
            © 2024 quotesKu • by Fatkhurrhn & Storythur
          </p>
        </div>
      </footer>
    </div>
  );
}