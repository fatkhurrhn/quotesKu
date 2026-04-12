// ManageQuotes.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export default function ManageQuotes() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [title, setTitle] = useState('');
    const [quotes, setQuotes] = useState(['']);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'quotes_cards'));
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

    const handleDelete = async (id) => {
        if (window.confirm('Yakin hapus card ini? Semua quotes di dalamnya akan hilang.')) {
            await deleteDoc(doc(db, 'quotes_cards', id));
            fetchCards();
        }
    };

    const openModal = (card = null) => {
        if (card) {
            setEditingCard(card);
            setTitle(card.title || '');
            setQuotes(card.quotes || ['']);
        } else {
            setEditingCard(null);
            setTitle('');
            setQuotes(['']);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCard(null);
        setTitle('');
        setQuotes(['']);
    };

    const handleQuoteChange = (index, value) => {
        const newQuotes = [...quotes];
        newQuotes[index] = value;
        setQuotes(newQuotes);
    };

    const addQuoteField = () => {
        setQuotes([...quotes, '']);
    };

    const removeQuoteField = (index) => {
        const newQuotes = quotes.filter((_, i) => i !== index);
        if (newQuotes.length === 0) setQuotes(['']);
        else setQuotes(newQuotes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const filteredQuotes = quotes.filter(q => q.trim() !== '');
        const data = {
            title: title.trim() || null,
            quotes: filteredQuotes,
            updatedAt: new Date()
        };

        try {
            if (editingCard) {
                await updateDoc(doc(db, 'quotes_cards', editingCard.id), data);
                alert('✅ Card berhasil diupdate!');
            } else {
                await addDoc(collection(db, 'quotes_cards'), {
                    ...data,
                    createdAt: new Date()
                });
                alert('✅ Card berhasil dibuat!');
            }
            closeModal();
            fetchCards();
        } catch (error) {
            console.error('Error saving card:', error);
            alert('❌ Gagal menyimpan card');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
            <div className="text-center">
                <i className="ri-loader-4-line text-4xl animate-spin" style={{ color: '#355485' }}></i>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
            {/* Header Desktop */}
            <div className="shadow-sm" style={{ backgroundColor: '#355485' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <Link to="/quotes-vid" className="text-white hover:opacity-80">
                                <i className="ri-arrow-left-line text-xl"></i>
                            </Link>
                            <h1 className="text-xl font-bold text-white">Dashboard Manage Quotes</h1>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                            style={{ backgroundColor: '#4f90c6', color: 'white' }}
                        >
                            <i className="ri-add-line"></i>
                            Buat Card Baru
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats */}
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#cbdde9' }}>
                    <p className="text-sm" style={{ color: '#355485' }}>
                        <i className="ri-database-2-line mr-2"></i>
                        Total Cards: <span className="font-bold">{cards.length}</span> |
                        Total Quotes: <span className="font-bold">{cards.reduce((sum, card) => sum + (card.quotes?.length || 0), 0)}</span>
                    </p>
                </div>

                {/* Cards Grid - Desktop Optimized */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map(card => (
                        <div key={card.id} className="rounded-xl overflow-hidden shadow-sm transition hover:shadow-md" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                            <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                <h3 className="font-semibold text-lg" style={{ color: '#355485' }}>{card.title || 'Untitled Card'}</h3>
                                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                                    <i className="ri-double-quotes-l"></i> {card.quotes?.length || 0} quotes
                                </p>
                            </div>

                            <div className="p-4">
                                <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
                                    {card.quotes?.map((quote, idx) => (
                                        <div key={idx} className="p-2 rounded" style={{ backgroundColor: '#f9fafb' }}>
                                            <p className="text-sm" style={{ color: '#6b7280' }}>
                                                <span className="font-medium mr-2" style={{ color: '#4f90c6' }}>{idx + 1}.</span>
                                                {quote}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(card)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-medium transition"
                                        style={{ backgroundColor: '#90b6d5', color: '#355485' }}
                                    >
                                        <i className="ri-edit-line"></i>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-medium transition"
                                        style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}
                                    >
                                        <i className="ri-delete-bin-line"></i>
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {cards.length === 0 && (
                    <div className="text-center py-16">
                        <i className="ri-file-copy-line text-6xl mb-3 block" style={{ color: '#cbdde9' }}></i>
                        <p style={{ color: '#6b7280' }}>Belum ada quotes card</p>
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: '#355485', color: 'white' }}
                        >
                            <i className="ri-add-line"></i>
                            Buat Card Baru
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
                        <div className="sticky top-0 p-4 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold" style={{ color: '#355485' }}>
                                    {editingCard ? 'Edit Quotes Card' : 'Buat Quotes Card Baru'}
                                </h2>
                                <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-100">
                                    <i className="ri-close-line text-2xl" style={{ color: '#6b7280' }}></i>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#355485' }}>Judul Card (opsional)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                                    style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
                                    placeholder="Misal: Quotes Tentang Kehidupan"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#355485' }}>Daftar Quotes/Kalimat</label>
                                {quotes.map((quote, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <textarea
                                            value={quote}
                                            onChange={(e) => handleQuoteChange(idx, e.target.value)}
                                            className="flex-1 border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2"
                                            style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
                                            placeholder={`Kalimat ${idx + 1}`}
                                            rows="2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeQuoteField(idx)}
                                            className="px-3 rounded-lg transition"
                                            style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addQuoteField}
                                    className="flex items-center gap-1 mt-2 text-sm font-medium"
                                    style={{ color: '#4f90c6' }}
                                >
                                    <i className="ri-add-line"></i> Tambah Kalimat
                                </button>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-2 rounded-lg font-medium text-white transition disabled:opacity-50"
                                    style={{ backgroundColor: '#355485' }}
                                >
                                    {saving ? 'Menyimpan...' : (editingCard ? 'Update' : 'Simpan')}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-2 rounded-lg font-medium transition"
                                    style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}