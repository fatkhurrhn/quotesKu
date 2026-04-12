import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, orderBy, where } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

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

const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    return text.split(regex).map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
        ) : (
            part
        )
    );
};

export default function Search() {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get("q") || "";

    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all approved quotes
    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const q = query(
                    myQuotesCollection,
                    where("status", "==", "approved"),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setQuotes(data);
            } catch (err) {
                console.error("Error fetch quotes:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotes();
    }, []);

    // Filter quotes based on keyword
    useEffect(() => {
        if (keyword && quotes.length > 0) {
            const filtered = quotes.filter((quote) =>
                quote.text.toLowerCase().includes(keyword.toLowerCase())
            );
            setFilteredQuotes(filtered);
        } else {
            setFilteredQuotes([]);
        }
    }, [keyword, quotes]);

    const getAuthorIcon = (author) => {
        if (author?.toLowerCase() === "storythur") return "📖";
        if (author?.toLowerCase() === "fatkhurrhn") return "🎓";
        return "💭";
    };

    return (
        <div className="min-h-screen bg-[#f9fafb] pb-16">
            <BottomNav />

            {/* Header - Modern */}
            <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2a436c] to-[#355485] pt-10 pb-6 rounded-b-3xl shadow-md">
                <div className="max-w-lg mx-auto px-5">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <i className="ri-arrow-left-line text-white text-lg"></i>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">Hasil Pencarian</h1>
                            <p className="text-[#cbdde9] text-xs mt-0.5">Temukan quotes yang kamu cari</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Info Card */}
            <div className="max-w-lg mx-auto px-5 -mt-4">
                <div className="bg-white rounded-xl p-4 shadow-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* <div className="w-8 h-8 bg-[#cbdde9] rounded-lg flex items-center justify-center">
                                <i className="ri-search-line text-[#355485] text-sm"></i>
                            </div> */}
                            <div>
                                <p className="text-xs text-[#6b7280]">Kata kunci "{keyword}"</p>
                            </div>
                        </div>
                        <Link
                            to="/"
                            className="text-xs text-[#4f90c6] hover:text-[#355485] font-medium flex items-center gap-1"
                        >
                            <i className="ri-refresh-line"></i>
                            Cari lagi
                        </Link>
                    </div>
                </div>
            </div>

            {/* Result Stats */}
            <div className="max-w-lg mx-auto px-5 mt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <i className="ri-file-list-line text-[#9ca3af] text-sm"></i>
                        <span className="text-xs text-[#6b7280]">
                            {loading ? "Memuat data..." : `Menampilkan ${filteredQuotes.length} hasil`}
                        </span>
                    </div>
                    {!loading && filteredQuotes.length > 0 && (
                        <span className="text-[10px] text-[#9ca3af]">Terbaru</span>
                    )}
                </div>
            </div>

            {/* Results Content */}
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
                                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-11/12 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredQuotes.length > 0 ? (
                    <div className="space-y-3">
                        {filteredQuotes.map((q) => {
                            const authorIcon = getAuthorIcon(q.author);
                            const authorColor = q.author?.toLowerCase() === "storythur"
                                ? "text-[#355485]"
                                : q.author?.toLowerCase() === "fatkhurrhn"
                                    ? "text-[#4f90c6]"
                                    : "text-gray-600";

                            return (
                                <div
                                    key={q.id}
                                    className="group bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:shadow-md hover:border-[#cbdde9] transition-all duration-200"
                                >
                                    {/* Header: Author + Time */}
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e5e7eb]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-gradient-to-tr from-[#355485] to-[#4f90c6] rounded-full flex items-center justify-center">
                                                <span className="text-sm">{authorIcon}</span>
                                            </div>
                                            <span className={`text-xs font-semibold ${authorColor}`}>
                                                {q.author}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <i className="ri-time-line text-[#9ca3af] text-[10px]"></i>
                                            <span className="text-[10px] text-[#9ca3af]">
                                                {getRelativeTime(q.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quote text with highlight */}
                                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                        {highlightText(q.text, keyword)}
                                    </p>

                                    {/* Category Badge */}
                                    {q.category && (
                                        <div className="flex items-center gap-1">
                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                                                <i className="ri-price-tag-3-line text-[10px] text-gray-500"></i>
                                                <span className="text-[10px] text-gray-500">
                                                    {q.category === "motivation" ? "Motivasi" :
                                                        q.category === "life" ? "Reminder" :
                                                            q.category === "love" ? "Cinta" :
                                                                q.category === "funny" ? "Lucu" : "Lainnya"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#e5e7eb]">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#cbdde9] to-[#e5e7eb] rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-search-eye-line text-4xl text-[#355485]"></i>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Tidak Ditemukan</h3>
                        <p className="text-[#6b7280] text-sm mb-2">
                            Quotes dengan kata "<span className="font-semibold text-[#355485]">{keyword}</span>" tidak tersedia
                        </p>
                        <p className="text-xs text-[#9ca3af] mb-6">Coba gunakan kata kunci lain yang lebih umum</p>

                        <div className="border-t border-[#e5e7eb] pt-6">
                            <p className="text-xs text-[#6b7280] mb-3">Rekomendasi pencarian:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["inspirasi", "cinta", "sukses", "motivasi", "kuliah", "bahagia", "kerja", "sabar"].map((tag) => (
                                    <Link
                                        key={tag}
                                        to={`/search?q=${tag}`}
                                        className="text-xs text-[#4f90c6] hover:text-white px-3 py-1.5 rounded-full bg-[#cbdde9]/30 hover:bg-[#355485] transition-all"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <Link
                            to="/"
                            className="mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#355485] to-[#4f90c6] text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-md transition-all"
                        >
                            <i className="ri-home-line"></i>
                            Kembali ke Beranda
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}