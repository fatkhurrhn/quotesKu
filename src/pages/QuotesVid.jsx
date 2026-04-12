// QuotesVid.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function QuotesVid() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            // Query dengan sorting berdasarkan createdAt descending (terbaru di atas)
            const q = query(collection(db, 'quotes_cards'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const cardsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCards(cardsData);
        } catch (error) {
            console.error("Error fetching cards:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk format waktu relatif
    const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Baru saja';
        
        const now = new Date();
        const past = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
        return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
            <div className="text-center">
                <i className="ri-loader-4-line text-4xl animate-spin" style={{ color: '#355485' }}></i>
                <p className="mt-2" style={{ color: '#6b7280' }}>Memuat quotes...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4 shadow-sm" style={{ backgroundColor: '#355485' }}>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-white">Quotes Cards</h1>
                        <p className="text-xs text-white opacity-80 mt-0.5">
                            {cards.length} card tersedia
                        </p>
                    </div>
                    <Link
                        to="/manage"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                        style={{ backgroundColor: '#4f90c6', color: 'white' }}
                    >
                        <i className="ri-dashboard-line"></i>
                        <span>Manage</span>
                    </Link>
                </div>
            </div>

            {/* Cards List */}
            <div className="px-4 py-4 space-y-4 max-w-full">
                {cards.map((card, index) => (
                    <div 
                        key={card.id} 
                        className="rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.99]"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                    >
                        <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base break-words" style={{ color: '#355485' }}>
                                        {card.title || 'Untitled Card'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                                            <i className="ri-double-quotes-l mr-1"></i> 
                                            {card.quotes?.length || 0} quotes
                                        </p>
                                        {card.createdAt && (
                                            <p className="text-xs" style={{ color: '#9ca3af' }}>
                                                <i className="ri-time-line mr-1"></i>
                                                {getRelativeTime(card.createdAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {index === 0 && (
                                    <span 
                                        className="text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap"
                                        style={{ backgroundColor: '#35548510', color: '#355485' }}
                                    >
                                        <i className="ri-flash-fill mr-1 text-xs"></i>
                                        Terbaru
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                                {card.quotes?.slice(0, 3).map((quote, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span 
                                            className="font-medium text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                                            style={{ backgroundColor: '#4f90c620', color: '#355485' }}
                                        >
                                            {idx + 1}
                                        </span>
                                        <p className="text-sm flex-1 break-words" style={{ color: '#6b7280' }}>
                                            {quote.length > 70 ? quote.substring(0, 70) + '...' : quote}
                                        </p>
                                    </div>
                                ))}
                                {card.quotes?.length > 3 && (
                                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                                        +{card.quotes.length - 3} quotes lainnya
                                    </p>
                                )}
                            </div>

                            <Link
                                to={`/generate/${card.id}`}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium transition-all active:scale-95"
                                style={{ backgroundColor: '#4f90c6', color: 'white' }}
                            >
                                <i className="ri-download-line"></i>
                                Generate All
                            </Link>
                        </div>
                    </div>
                ))}

                {cards.length === 0 && (
                    <div className="text-center py-16 px-4">
                        <i className="ri-file-copy-line text-6xl mb-3 block" style={{ color: '#cbdde9' }}></i>
                        <p style={{ color: '#6b7280' }}>Belum ada quotes card</p>
                        <Link
                            to="/manage"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                            style={{ backgroundColor: '#355485', color: 'white' }}
                        >
                            <i className="ri-add-line"></i>
                            Buat Card Baru
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}