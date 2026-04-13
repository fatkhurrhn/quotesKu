import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { myQuotesCollection } from '../firebase';
import {
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

const ManageQuotes = () => {
  // Quotes state
  const [quotes, setQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingQuote, setEditingQuote] = useState(null);

  // Add quote popup state
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [newQuote, setNewQuote] = useState({ text: '', author: '', category: 'motivation' });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Import Excel state
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  // History state
  const [history, setHistory] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState('');

  // Notification sending state
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('quoteAddHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('quoteAddHistory', JSON.stringify(history));
  }, [history]);

  // Fetch quotes from Firestore
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        let q;
        if (statusFilter === 'all') {
          q = query(myQuotesCollection, orderBy('createdAt', 'desc'));
        } else {
          q = query(
            myQuotesCollection,
            where('status', '==', statusFilter),
            orderBy('createdAt', 'desc')
          );
        }
        const querySnapshot = await getDocs(q);
        const quotesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotes(quotesData);
      } catch (error) {
        console.error("Error fetching quotes: ", error);
      }
    };
    fetchQuotes();
  }, [statusFilter]);

  // Send Telegram notification for approved quote
  const sendTelegramApproveNotification = async (author, quoteText) => {
    try {
      await fetch('/api/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'approved',
          author: author,
          quoteText: quoteText,
        }),
      });
      console.log('Telegram approve notification sent');
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchTerm === '' ||
      quote.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || quote.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Send notification to subscribers
  const sendNotificationToSubscribers = async (quote) => {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          author: quote.author,
          text: quote.text
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Notifikasi terkirim:', data.message);
        showNotificationMessage('📧 Notifikasi telah dikirim ke subscriber!', 'success');
      } else {
        console.error('Gagal kirim notifikasi:', data.error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Handle status change with notification
  // Handle status change with notification
  const handleStatusChange = async (quoteId, newStatus, quoteData) => {
    try {
      const quoteRef = doc(myQuotesCollection, quoteId);
      await updateDoc(quoteRef, { status: newStatus, updatedAt: new Date() });

      setQuotes(quotes.map(quote =>
        quote.id === quoteId ? { ...quote, status: newStatus } : quote
      ));

      showNotificationMessage(`Status berhasil diubah menjadi ${newStatus}!`, 'success');

      // Kirim notifikasi TELEGRAM jika status berubah menjadi "approved"
      if (newStatus === 'approved' && quoteData) {
        // Kirim ke Telegram
        await sendTelegramApproveNotification(quoteData.author, quoteData.text);

        // Kirim ke email subscriber
        setIsSendingNotification(true);
        await sendNotificationToSubscribers(quoteData);
        setIsSendingNotification(false);
      }
    } catch (error) {
      console.error("Error updating quote status: ", error);
      showNotificationMessage('Gagal mengubah status', 'error');
    }
  };

  const handleEdit = (quote) => setEditingQuote(quote);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const quoteRef = doc(myQuotesCollection, editingQuote.id);
      await updateDoc(quoteRef, {
        text: editingQuote.text,
        author: editingQuote.author,
        category: editingQuote.category,
        updatedAt: new Date()
      });
      setQuotes(quotes.map(quote =>
        quote.id === editingQuote.id ? editingQuote : quote
      ));
      setEditingQuote(null);
      showNotificationMessage('Quote berhasil diupdate!', 'success');
    } catch (error) {
      console.error("Error updating quote: ", error);
      showNotificationMessage('Gagal mengupdate quote', 'error');
    }
  };

  const handleDelete = async (quoteId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus quote ini?")) {
      try {
        await deleteDoc(doc(myQuotesCollection, quoteId));
        setQuotes(quotes.filter(quote => quote.id !== quoteId));
        showNotificationMessage('Quote berhasil dihapus!', 'success');
      } catch (error) {
        console.error("Error deleting quote: ", error);
        showNotificationMessage('Gagal menghapus quote', 'error');
      }
    }
  };

  const handleAddQuote = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const docRef = await addDoc(myQuotesCollection, {
        text: newQuote.text,
        author: newQuote.author,
        category: newQuote.category,
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0,
      });

      const historyEntry = {
        id: docRef.id,
        text: newQuote.text,
        author: newQuote.author,
        category: newQuote.category,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyEntry, ...prev].slice(0, 20));

      const newQuoteData = {
        id: docRef.id,
        text: newQuote.text,
        author: newQuote.author,
        category: newQuote.category,
        status: "approved"
      };
      setQuotes(prev => [newQuoteData, ...prev]);

      setNewQuote({ text: '', author: '', category: 'motivation' });
      setSelectedAuthor('');
      setIsAddPopupOpen(false);
      showNotificationMessage('Quote berhasil ditambahkan!', 'success');

      // Kirim notifikasi TELEGRAM untuk quote yang langsung approved
      await sendTelegramApproveNotification(newQuote.author, newQuote.text);

      // Kirim notifikasi email ke subscriber
      setIsSendingNotification(true);
      await sendNotificationToSubscribers(newQuoteData);
      setIsSendingNotification(false);
    } catch (error) {
      console.error("Error adding quote: ", error);
      showNotificationMessage('Gagal menambahkan quote', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    setImportFile(file);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const previewData = jsonData.map((row, index) => {
          const quoteKey = Object.keys(row).find(key =>
            key.toLowerCase().includes('quote') || key.toLowerCase().includes('text')
          );
          const authorKey = Object.keys(row).find(key =>
            key.toLowerCase().includes('author') || key.toLowerCase().includes('penulis')
          );
          const categoryKey = Object.keys(row).find(key =>
            key.toLowerCase().includes('category') || key.toLowerCase().includes('kategori')
          );

          let category = categoryKey ? row[categoryKey] : 'motivation';
          const validCategories = ['motivation', 'life', 'love', 'wisdom', 'funny', 'other'];
          if (!validCategories.includes(category?.toLowerCase())) {
            category = 'motivation';
          }

          const quoteText = quoteKey ? row[quoteKey] : '';
          const author = authorKey ? row[authorKey] : 'Anonymous';

          return {
            id: `preview-${index}`,
            text: quoteText?.toString().trim() || '',
            author: author?.toString().trim() || 'Anonymous',
            category: category.toLowerCase(),
            originalRow: row,
          };
        }).filter(item => item.text !== '');

        setImportPreview(previewData);
        if (previewData.length === 0) {
          setImportErrors(['Tidak ada quote valid yang ditemukan di file.']);
        }
      } catch (error) {
        console.error("Error parsing file: ", error);
        setImportErrors(['Gagal membaca file. Pastikan format file benar.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) {
      showNotificationMessage('Tidak ada quote valid untuk diimport', 'error');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;
    const addedQuotes = [];

    for (const quote of importPreview) {
      try {
        const docRef = await addDoc(myQuotesCollection, {
          text: quote.text,
          author: quote.author,
          category: quote.category,
          status: "approved",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likes: 0,
          views: 0,
        });

        const historyEntry = {
          id: docRef.id,
          text: quote.text,
          author: quote.author,
          category: quote.category,
          timestamp: new Date().toISOString(),
          imported: true
        };
        setHistory(prev => [historyEntry, ...prev].slice(0, 20));

        addedQuotes.push({
          id: docRef.id,
          text: quote.text,
          author: quote.author,
          category: quote.category,
          status: "approved"
        });

        successCount++;
      } catch (error) {
        console.error("Error adding quote: ", error);
        failCount++;
      }
    }

    // Di dalam handleImportSubmit, setelah addedQuotes.length > 0
    if (addedQuotes.length > 0) {
      setQuotes(prev => [...addedQuotes, ...prev]);

      // Kirim notifikasi TELEGRAM untuk quote pertama yang diimport
      if (addedQuotes.length > 0) {
        const firstQuote = addedQuotes[0];
        await sendTelegramApproveNotification(firstQuote.author, firstQuote.text);

        setIsSendingNotification(true);
        await sendNotificationToSubscribers(firstQuote);
        setIsSendingNotification(false);
      }
    }
    

    const importHistory = {
      id: Date.now(),
      filename: importFile?.name,
      date: new Date().toISOString(),
      total: importPreview.length,
      success: successCount,
      failed: failCount,
    };

    const savedImports = localStorage.getItem('quoteImportHistory');
    const importsList = savedImports ? JSON.parse(savedImports) : [];
    importsList.unshift(importHistory);
    localStorage.setItem('quoteImportHistory', JSON.stringify(importsList.slice(0, 10)));

    showNotificationMessage(`Berhasil import ${successCount} quotes${failCount > 0 ? `, ${failCount} gagal` : ''}`, successCount > 0 ? 'success' : 'error');

    setIsImportPopupOpen(false);
    setImportPreview([]);
    setImportFile(null);
    setImportErrors([]);
    setIsImporting(false);
  };

  const showNotificationMessage = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuthorSelect = (authorName) => {
    setSelectedAuthor(authorName);
    setNewQuote(prev => ({ ...prev, author: authorName }));
  };

  const clearHistory = () => {
    if (window.confirm('Hapus semua history?')) {
      setHistory([]);
      localStorage.removeItem('quoteAddHistory');
      showNotificationMessage('History berhasil dihapus!', 'success');
    }
  };

  const getCategoryStyle = (category) => {
    const styles = {
      motivation: 'bg-blue-100 text-blue-800',
      life: 'bg-green-100 text-green-800',
      love: 'bg-pink-100 text-pink-800',
      wisdom: 'bg-purple-100 text-purple-800',
      funny: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return styles[category] || styles.other;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      motivation: 'Motivasi',
      life: 'Reminder',
      love: 'Cinta',
      wisdom: 'Kebijaksanaan',
      funny: 'Lucu',
      other: 'Lainnya'
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2a436c] to-[#355485] pt-10 pb-8 rounded-b-3xl shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Manage Quotes</h1>
              <p className="text-[#cbdde9] text-xs">Kelola semua quotes di aplikasi</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsImportPopupOpen(true)}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-white/20"
              >
                <i className="ri-upload-2-line text-xl"></i>
                Import Excel
              </button>
              <button
                onClick={() => setIsAddPopupOpen(true)}
                className="bg-white text-[#355485] hover:bg-gray-100 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md font-medium"
              >
                <i className="ri-add-line text-xl"></i>
                Tambah Quote
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all animate-slide-down ${notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
          }`}>
          <i className={`${notification.type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} text-xl`}></i>
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6b7280] text-xs">Total Quotes</p>
                <p className="text-2xl font-bold text-[#355485]">{quotes.length}</p>
              </div>
              <div className="w-10 h-10 bg-[#cbdde9] rounded-lg flex items-center justify-center">
                <i className="ri-double-quotes-l text-[#355485] text-lg"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6b7280] text-xs">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{quotes.filter(q => q.status === 'pending').length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-yellow-600 text-lg"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6b7280] text-xs">Approved</p>
                <p className="text-2xl font-bold text-green-600">{quotes.filter(q => q.status === 'approved').length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-600 text-lg"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6b7280] text-xs">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{quotes.filter(q => q.status === 'rejected').length}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-circle-line text-red-600 text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] text-lg"></i>
            <input
              type="text"
              placeholder="Cari quote atau author..."
              className="w-full p-3 pl-10 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full p-3 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
          <select
            className="w-full p-3 rounded-xl border border-[#e5e7eb] bg-white text-gray-800 focus:outline-none focus:border-[#4f90c6] focus:ring-1 focus:ring-[#4f90c6] text-sm cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            <option value="motivation">🔥 Motivasi</option>
            <option value="life">💭 Reminder</option>
            <option value="love">❤️ Cinta</option>
            <option value="wisdom">📖 Kebijaksanaan</option>
            <option value="funny">😂 Lucu</option>
            <option value="other">📌 Lainnya</option>
          </select>
        </div>

        {/* Import Excel Popup */}
        {isImportPopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Import Quotes dari Excel/CSV</h2>
                  <button onClick={() => {
                    setIsImportPopupOpen(false);
                    setImportPreview([]);
                    setImportFile(null);
                    setImportErrors([]);
                  }} className="text-gray-500 hover:text-gray-700">
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (Excel/CSV)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#4f90c6] transition">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="fileUpload"
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2 block"></i>
                      <p className="text-gray-600">Klik untuk upload</p>
                      <p className="text-sm text-gray-400 mt-1">Support .xlsx, .xls, .csv</p>
                    </label>
                  </div>
                  {importFile && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <i className="ri-file-excel-line"></i>
                      <span>{importFile.name}</span>
                    </div>
                  )}
                </div>

                {importErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-red-800 font-medium mb-2">Error:</h3>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {importErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importPreview.length > 0 && (
                  <>
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-800 mb-2">
                        Preview ({importPreview.length} quotes ditemukan)
                      </h3>
                      <div className="text-sm text-gray-500 mb-2">
                        File akan diimport dengan status "Approved" secara otomatis
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {importPreview.map((quote, idx) => (
                            <tr key={quote.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                              <td className="px-4 py-3 text-sm text-gray-800 max-w-md">
                                <div className="line-clamp-2">"{quote.text}"</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{quote.author}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryStyle(quote.category)}`}>
                                  {getCategoryLabel(quote.category)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setIsImportPopupOpen(false);
                          setImportPreview([]);
                          setImportFile(null);
                        }}
                        className="px-4 py-2 border rounded-xl text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleImportSubmit}
                        disabled={isImporting}
                        className="px-6 py-2 bg-[#355485] text-white rounded-xl hover:bg-[#2a436c] disabled:opacity-70 flex items-center gap-2"
                      >
                        {isImporting ? (
                          <>
                            <i className="ri-loader-4-line animate-spin"></i>
                            Importing...
                          </>
                        ) : (
                          <>
                            <i className="ri-database-2-line"></i>
                            Import {importPreview.length} Quotes
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Quote Modal */}
        {editingQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Edit Quote</h2>
                  <button onClick={() => setEditingQuote(null)} className="text-gray-500 hover:text-gray-700">
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6] focus:border-transparent"
                    rows={4}
                    value={editingQuote.text}
                    onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6]"
                    value={editingQuote.author}
                    onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                    required
                  />
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6]"
                    value={editingQuote.category}
                    onChange={(e) => setEditingQuote({ ...editingQuote, category: e.target.value })}
                  >
                    <option value="motivation">Motivasi</option>
                    <option value="life">Reminder</option>
                    <option value="love">Cinta</option>
                    <option value="wisdom">Kebijaksanaan</option>
                    <option value="funny">Lucu</option>
                    <option value="other">Lainnya</option>
                  </select>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setEditingQuote(null)} className="px-4 py-2 border rounded-xl text-gray-700 hover:bg-gray-50">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-[#355485] text-white rounded-xl hover:bg-[#2a436c]">Simpan</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Quote Popup */}
        {isAddPopupOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Tambah Quote Baru</h2>
                  <button onClick={() => setIsAddPopupOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
                <form onSubmit={handleAddQuote} className="space-y-4">
                  <textarea
                    placeholder="Tulis quote di sini..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4f90c6]"
                    value={newQuote.text}
                    onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                    required
                  />
                  <div>
                    <input
                      placeholder="Nama author"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4f90c6]"
                      value={newQuote.author}
                      onChange={(e) => {
                        setNewQuote({ ...newQuote, author: e.target.value });
                        setSelectedAuthor('');
                      }}
                      required
                    />
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="authorRadio"
                          checked={selectedAuthor === 'storythur'}
                          onChange={() => handleAuthorSelect('storythur')}
                          className="w-4 h-4 text-[#355485]"
                        />
                        <span className="text-sm">storythur</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="authorRadio"
                          checked={selectedAuthor === 'fatkhurrhn'}
                          onChange={() => handleAuthorSelect('fatkhurrhn')}
                          className="w-4 h-4 text-[#355485]"
                        />
                        <span className="text-sm">fatkhurrhn</span>
                      </label>
                    </div>
                  </div>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#4f90c6]"
                    value={newQuote.category}
                    onChange={(e) => setNewQuote({ ...newQuote, category: e.target.value })}
                  >
                    <option value="motivation">🔥 Motivasi</option>
                    <option value="life">💭 Reminder</option>
                    <option value="love">❤️ Cinta</option>
                    <option value="wisdom">📖 Kebijaksanaan</option>
                    <option value="funny">😂 Lucu</option>
                    <option value="other">📌 Lainnya</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isLoading || isSendingNotification}
                    className="w-full py-3 bg-[#355485] text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-70 hover:bg-[#2a436c] transition"
                  >
                    {isLoading || isSendingNotification ? (
                      <><i className="ri-loader-4-line animate-spin mr-2"></i>Memproses...</>
                    ) : (
                      'Tambah Quote'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Quotes Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 p-4 font-semibold text-gray-700 text-sm border-b border-[#e5e7eb]">
            <div className="col-span-5 sm:col-span-5">Quote</div>
            <div className="col-span-3 sm:col-span-2">Author</div>
            <div className="col-span-2 hidden sm:block">Category</div>
            <div className="col-span-2 sm:col-span-2">Status</div>
            <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((quote) => (
                <div key={quote.id} className="grid grid-cols-12 p-4 items-center text-sm hover:bg-gray-50 transition">
                  <div className="col-span-5 sm:col-span-5 text-gray-800 line-clamp-2 pr-2">"{quote.text}"</div>
                  <div className="col-span-3 sm:col-span-2 text-gray-600">{quote.author}</div>
                  <div className="col-span-2 hidden sm:block">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryStyle(quote.category)}`}>
                      {getCategoryLabel(quote.category)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <select
                      className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          quote.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800 border-red-200'
                        }`}
                      value={quote.status || 'pending'}
                      onChange={(e) => handleStatusChange(quote.id, e.target.value, quote)}
                      disabled={isSendingNotification}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="approved">✅ Approved</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-3">
                    <button onClick={() => handleEdit(quote)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                      <i className="ri-edit-line text-lg"></i>
                    </button>
                    <button onClick={() => handleDelete(quote.id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <i className="ri-inbox-line text-5xl text-gray-300 mb-3"></i>
                <p>Tidak ada quotes yang ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-[#e5e7eb]">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <i className="ri-history-line text-[#355485]"></i>
                History Tambah Quote
              </h3>
              <button onClick={clearHistory} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 transition">
                <i className="ri-delete-bin-line"></i>
                Hapus semua
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="p-3 hover:bg-gray-50 transition">
                  <p className="text-gray-800 text-sm">"{item.text.substring(0, 80)}{item.text.length > 80 ? '...' : ''}"</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span><i className="ri-user-line"></i> {item.author}</span>
                    <span><i className="ri-price-tag-3-line"></i> {getCategoryLabel(item.category)}</span>
                    <span><i className="ri-time-line"></i> {new Date(item.timestamp).toLocaleString()}</span>
                    {item.imported && <span><i className="ri-upload-2-line"></i> Imported</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageQuotes;