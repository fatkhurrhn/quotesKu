import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { myQuotesCollection } from "../firebase";
import { getDocs, query, orderBy } from "firebase/firestore";
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
            <mark key={i} className="bg-yellow-300 px-1 rounded">{part}</mark>
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

    // Fetch all quotes
    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const q = query(myQuotesCollection, orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                const approved = data.filter((quote) => quote.status === "approved");
                setQuotes(approved);
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

    return (
        <div className="min-h-screen bg-[#f9fafb] pb-16">
            <BottomNav />

            {/* Header Simple */}
            <div className="bg-gradient-to-r from-[#355485] to-[#4f90c6] pt-4 pb-3 rounded-b-3xl shadow-md">
                <div className="max-w-lg mx-auto px-5">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-white hover:text-[#cbdde9] transition-colors">
                            <i className="ri-arrow-left-line text-2xl"></i>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">Hasil Pencarian</h1>
                            
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Info */}
            <div className="max-w-lg mx-auto px-5 mt-4 mb-4">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e5e7eb]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <i className="ri-search-line text-[#4f90c6]"></i>
                            <span className="text-sm text-gray-700">
                                {loading ? "Mencari..." : `Ditemukan kata "${keyword}" di ${filteredQuotes.length} quotes`}
                            </span>
                        </div>
                        <Link to="/" className="text-xs text-[#4f90c6] hover:underline">
                            Cari lagi
                        </Link>
                    </div>
                </div>
            </div>

            {/* Results */}
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
                            </div>
                        ))}
                    </div>
                ) : filteredQuotes.length > 0 ? (
                    <div className="space-y-3">
                        {filteredQuotes.map((q) => {
                            const authorIcon = q.author?.toLowerCase() === "storythur" ? "📖" : "🎓";

                            return (
                                <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb] hover:shadow-md transition-all">
                                    {/* Header: Author + Time */}
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e5e7eb]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{authorIcon}</span>
                                            <span className="text-xs font-medium text-[#355485]">
                                                {q.author}
                                            </span>
                                        </div>
                                        <span className="text-xs text-[#9ca3af]">
                                            {getRelativeTime(q.createdAt)}
                                        </span>
                                    </div>

                                    {/* Quote text with highlight */}
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {highlightText(q.text, keyword)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#e5e7eb]">
                        <div className="w-20 h-20 bg-[#cbdde9] rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ri-search-line text-3xl text-[#355485]"></i>
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Tidak ada quotes ditemukan</h3>
                        <p className="text-[#6b7280] text-sm mb-4">
                            Quotes dengan kata "<span className="font-medium">{keyword}</span>" tidak ditemukan
                        </p>
                        <div className="flex flex-col gap-2">
                            <p className="text-xs text-[#9ca3af]">Coba kata kunci lain seperti:</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["cinta", "sukses", "motivasi", "kuliah", "bahagia"].map((tag) => (
                                    <Link
                                        key={tag}
                                        to={`/search?q=${tag}`}
                                        className="text-xs text-[#4f90c6] hover:text-[#355485] px-2 py-1 rounded-full bg-[#cbdde9]/30 hover:bg-[#cbdde9]/50 transition-all"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                            <Link to="/" className="mt-4 inline-flex items-center justify-center gap-1 text-[#4f90c6] text-sm font-medium">
                                Kembali ke Beranda <i className="ri-arrow-right-line"></i>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}