/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Copy, 
  Check, 
  RefreshCw,
  Smile,
  Zap,
  Leaf,
  Ghost,
  Info,
  Calendar,
  ShieldCheck,
  XCircle,
  Lightbulb,
  Camera,
  Image as ImageIcon,
  Upload,
  UserSearch,
  BookOpen,
  Clock,
  Plus,
  Trash2,
  Coffee,
  Film,
  Utensils,
  Music,
  Gamepad2,
  Plane,
  Beer,
  Moon
} from 'lucide-react';
import { 
  getReplySuggestions, 
  getDateSuggestions, 
  getLoveAdvice, 
  getFinalSummary,
  analyzeCrushImage,
  analyzeJournal,
  ReplySuggestion, 
  DateSuggestion, 
  LoveAdvice, 
  LoveSummary,
  ImageAnalysis,
  JournalEntry,
  JournalAnalysis,
  Vibe 
} from './services/gemini';

const VIBES: { id: Vibe; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'funny', label: 'Hài hước', icon: Smile, color: 'text-orange-500 bg-orange-50', desc: 'Duyyên dáng, thông minh' },
  { id: 'subtle', label: 'Tinh tế', icon: Leaf, color: 'text-emerald-500 bg-emerald-50', desc: 'Sâu sắc, nhẹ nhàng' },
  { id: 'flirty', label: 'Thả thính', icon: Heart, color: 'text-rose-500 bg-rose-50', desc: 'Ngọt ngào, rung động' },
  { id: 'mysterious', label: 'Bí ẩn', icon: Ghost, color: 'text-purple-500 bg-purple-50', desc: 'Lạnh lùng, cuốn hút' },
];

type Tab = 'reply' | 'date' | 'advice' | 'vision' | 'journal';

const MOODS = [
  { id: 'smile', icon: Smile, color: 'text-emerald-400 bg-emerald-50' },
  { id: 'heart', icon: Heart, color: 'text-rose-400 bg-rose-50' },
  { id: 'coffee', icon: Coffee, color: 'text-amber-600 bg-amber-50' },
  { id: 'film', icon: Film, color: 'text-purple-400 bg-purple-50' },
  { id: 'utensils', icon: Utensils, color: 'text-orange-400 bg-orange-50' },
  { id: 'music', icon: Music, color: 'text-blue-400 bg-blue-50' },
  { id: 'gamepad', icon: Gamepad2, color: 'text-indigo-400 bg-indigo-50' },
  { id: 'plane', icon: Plane, color: 'text-sky-400 bg-sky-50' },
  { id: 'beer', icon: Beer, color: 'text-yellow-600 bg-yellow-50' },
  { id: 'moon', icon: Moon, color: 'text-slate-400 bg-slate-50' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('reply');
  const [crushMessage, setCrushMessage] = useState('');
  const [dateContext, setDateContext] = useState('');
  const [adviceContext, setAdviceContext] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<Vibe>('funny');
  const [loading, setLoading] = useState(false);
  
  const [suggestions, setSuggestions] = useState<ReplySuggestion[]>([]);
  const [dateSuggestions, setDateSuggestions] = useState<DateSuggestion[]>([]);
  
  // Vision state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visionMode, setVisionMode] = useState<'personality' | 'comment'>('personality');
  const [visionResult, setVisionResult] = useState<ImageAnalysis | null>(null);

  // Advice state
  const [adviceHistory, setAdviceHistory] = useState<{ context: string, advice: LoveAdvice }[]>([]);
  const [finalSummary, setFinalSummary] = useState<LoveSummary | null>(null);
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('crush_buddy_journal');
    return saved ? JSON.parse(saved) : [];
  });
  
  React.useEffect(() => {
    localStorage.setItem('crush_buddy_journal', JSON.stringify(journalEntries));
  }, [journalEntries]);

  const [newJournalContent, setNewJournalContent] = useState('');
  const [newJournalImage, setNewJournalImage] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState('smile');
  const [journalAnalysis, setJournalAnalysis] = useState<JournalAnalysis | null>(null);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleReplyGenerate = async () => {
    if (!crushMessage.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const data = await getReplySuggestions(crushMessage, selectedVibe);
      setSuggestions(data);
      scrollToResults();
    } catch (err) {
      setError('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateGenerate = async () => {
    if (!dateContext.trim()) return;
    setLoading(true);
    setError(null);
    setDateSuggestions([]);
    try {
      const data = await getDateSuggestions(dateContext);
      setDateSuggestions(data);
      scrollToResults();
    } catch (err) {
      setError('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdviceGenerate = async () => {
    if (!adviceContext.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const historyForAI = adviceHistory.map(h => ({ context: h.context, advice: h.advice.strategy }));
      const data = await getLoveAdvice(adviceContext, historyForAI);
      setAdviceHistory(prev => [...prev, { context: adviceContext, advice: data }]);
      setAdviceContext(''); // Clear for next round
      scrollToResults();
    } catch (err) {
      setError('Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSummary = async () => {
    if (adviceHistory.length === 0) return;
    setLoading(true);
    setFinalSummary(null);
    try {
      const historyForAI = adviceHistory.map(h => ({ context: h.context, advice: h.advice.strategy }));
      const data = await getFinalSummary(historyForAI);
      setFinalSummary(data);
      scrollToResults();
    } catch (err) {
      setError('Lỗi khi tổng kết.');
    } finally {
      setLoading(false);
    }
  };

  const resetAdvice = () => {
    setAdviceHistory([]);
    setFinalSummary(null);
    setAdviceContext('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setVisionResult(null);
    }
  };

  const handleVisionGenerate = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setVisionResult(null);
    try {
      const base64Data = imagePreview.split(',')[1];
      const mimeType = selectedImage?.type || 'image/jpeg';
      const result = await analyzeCrushImage(base64Data, mimeType, visionMode);
      setVisionResult(result);
      scrollToResults();
    } catch (err) {
      setError('Lỗi khi phân tích ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJournal = () => {
    if (!newJournalContent.trim()) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      timestamp: formattedDate,
      content: newJournalContent,
      mood: selectedMood,
      image: newJournalImage || undefined
    };
    setJournalEntries(prev => [...prev, newEntry]);
    setNewJournalContent('');
    setNewJournalImage(null);
  };

  const handleJournalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewJournalImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteJournal = (id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleJournalAnalyze = async () => {
    if (journalEntries.length === 0) return;
    setLoading(true);
    setJournalAnalysis(null);
    try {
      const result = await analyzeJournal(journalEntries);
      setJournalAnalysis(result);
      scrollToResults();
    } catch (err) {
      setError('Lỗi khi phân tích nhật ký.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-mint-50 font-sans text-slate-700 selection:bg-pink-soft pb-20">
      {/* Background Decor - Optimized for Safari */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 safari-blur-fix">
        <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full bg-pink-soft/60 blur-[100px] transform-gpu" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full bg-mint-100/60 blur-[100px] transform-gpu" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-12">
        {/* Header */}
        <header className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-4xl bg-white text-rose-400 shadow-sm mb-4 border border-rose-50"
          >
            <Heart className="w-8 h-8 fill-current" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold tracking-tight text-slate-800 mb-2"
          >
            Crush Buddy
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-sm font-semibold tracking-wide"
          >
            NHẬT KÝ TÌNH YÊU CỦA BẠN ✨
          </motion.p>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-white/60 backdrop-blur-sm p-1.5 rounded-4xl shadow-sm border border-white/50 mb-10 overflow-x-auto no-scrollbar transform-gpu">
          {[
            { id: 'reply', label: 'Rep tin nhắn', icon: MessageSquare },
            { id: 'date', label: 'Lịch hẹn', icon: Calendar },
            { id: 'advice', label: 'Bí kíp', icon: Lightbulb },
            { id: 'vision', label: 'Soi Profile', icon: UserSearch },
            { id: 'journal', label: 'Nhật ký', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab);
                setError(null);
                setSuggestions([]);
                setDateSuggestions([]);
                setAdviceHistory([]);
                setFinalSummary(null);
                setVisionResult(null);
                setJournalAnalysis(null);
              }}
              className={`flex-1 min-w-fit px-5 flex items-center justify-center gap-2 py-3.5 rounded-4xl transition-all font-bold text-xs uppercase tracking-wider ${
                activeTab === tab.id 
                  ? 'bg-white text-rose-400 shadow-md' 
                  : 'text-slate-400 hover:bg-white/40'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Section */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-4xl shadow-sm p-8 mb-10 border border-white"
        >
          {activeTab === 'reply' && (
            <>
              <div className="flex items-center gap-2 mb-6 text-slate-600 font-bold">
                <div className="w-10 h-10 rounded-2xl bg-mint-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-mint-500" />
                </div>
                <h2>Crush nhắn gì nhỉ?</h2>
              </div>
              <textarea
                value={crushMessage}
                onChange={(e) => setCrushMessage(e.target.value)}
                placeholder="Dán tin nhắn của Crush vào đây..."
                className="w-full min-h-[140px] p-5 rounded-4xl bg-mint-50 border-2 border-transparent focus:border-mint-200 focus:bg-white transition-all outline-none resize-none text-lg leading-relaxed placeholder:text-slate-300"
              />

              <div className="mt-10 mb-8">
                <div className="flex items-center gap-2 mb-6 text-slate-600 font-bold">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2>Giai điệu bạn chọn?</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {VIBES.map((vibe) => (
                    <button
                      key={vibe.id}
                      onClick={() => setSelectedVibe(vibe.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-4xl transition-all border-2 ${
                        selectedVibe === vibe.id 
                          ? 'border-mint-200 bg-white shadow-sm' 
                          : 'border-transparent bg-mint-50/50 hover:bg-mint-50'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${vibe.color}`}>
                        <vibe.icon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-bold text-slate-600">{vibe.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleReplyGenerate}
                disabled={loading || !crushMessage.trim()}
                className="w-full py-5 rounded-4xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-40 transition-all active:scale-[0.98] shadow-sm"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-rose-300" /> NHẬN GỢI Ý NGAY</>}
              </button>
            </>
          )}

          {activeTab === 'date' && (
            <>
              <div className="flex items-center gap-2 mb-6 text-slate-600 font-bold">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-rose-400" />
                </div>
                <h2>Bạn định rủ Crush đi đâu?</h2>
              </div>
              <textarea
                value={dateContext}
                onChange={(e) => setDateContext(e.target.value)}
                placeholder="VD: Muốn rủ cô ấy đi xem phim ngày mai..."
                className="w-full min-h-[140px] p-5 rounded-4xl bg-rose-50/30 border-2 border-transparent focus:border-rose-100 focus:bg-white transition-all outline-none resize-none text-lg leading-relaxed placeholder:text-slate-300"
              />
              <button
                onClick={handleDateGenerate}
                disabled={loading || !dateContext.trim()}
                className="w-full mt-8 py-5 rounded-4xl bg-rose-400 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-rose-500 disabled:opacity-40 transition-all active:scale-[0.98] shadow-sm"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Calendar className="w-5 h-5" /> CHỐT LỊCH NGAY</>}
              </button>
            </>
          )}

          {activeTab === 'advice' && (
            <>
              <div className="flex items-center gap-2 mb-6 text-slate-600 font-bold">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-purple-400" />
                </div>
                <h2>Đối tượng là người ntn?</h2>
              </div>
              <textarea
                value={adviceContext}
                onChange={(e) => setAdviceContext(e.target.value)}
                placeholder="VD: Cô ấy hơi lạnh lùng, thích chó mèo..."
                className="w-full min-h-[140px] p-5 rounded-4xl bg-purple-50/30 border-2 border-transparent focus:border-purple-100 focus:bg-white transition-all outline-none resize-none text-lg leading-relaxed placeholder:text-slate-300"
              />
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleAdviceGenerate}
                  disabled={loading || !adviceContext.trim()}
                  className="flex-1 py-5 rounded-4xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-40 transition-all active:scale-[0.98]"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-purple-300" /> THÊM TÌNH HUỐNG</>}
                </button>
                {adviceHistory.length > 0 && (
                  <button
                    onClick={handleFinalSummary}
                    disabled={loading}
                    className="py-5 px-8 rounded-4xl bg-rose-400 text-white font-bold flex items-center justify-center gap-2 hover:bg-rose-500 disabled:opacity-40 transition-all active:scale-[0.98]"
                    title="Tổng kết chiến lược"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    <span>TỔNG KẾT</span>
                  </button>
                )}
              </div>
              {adviceHistory.length > 0 && (
                <button 
                  onClick={resetAdvice}
                  className="w-full mt-6 text-xs font-bold text-slate-400 hover:text-rose-400 transition-all uppercase tracking-wider"
                >
                  Làm mới nhật ký hội thoại
                </button>
              )}
            </>
          )}

          {activeTab === 'vision' && (
            <>
              <div className="flex items-center gap-2 mb-6 text-slate-600 font-bold">
                <div className="w-10 h-10 rounded-2xl bg-mint-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-mint-500" />
                </div>
                <h2>Đọc vị qua lăng kính</h2>
              </div>
              
              <div 
                className={`relative group h-64 rounded-4xl border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${
                  imagePreview ? 'border-none' : 'border-mint-100 hover:border-mint-200 bg-mint-50/50'
                }`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => {setSelectedImage(null); setImagePreview(null);}}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-rose-400 rounded-full hover:bg-white transition-all shadow-sm"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-4xl flex items-center justify-center shadow-sm text-mint-400">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-slate-400 tracking-wide uppercase italic">Nhấn để tải lên</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => setVisionMode('personality')}
                  className={`py-4 rounded-4xl text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                    visionMode === 'personality' 
                      ? 'border-mint-200 bg-mint-50 text-mint-600' 
                      : 'border-transparent bg-slate-50 text-slate-400'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  TÍNH CÁCH
                </button>
                <button
                  onClick={() => setVisionMode('comment')}
                  className={`py-4 rounded-4xl text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                    visionMode === 'comment' 
                      ? 'border-mint-200 bg-mint-50 text-mint-600' 
                      : 'border-transparent bg-slate-50 text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  GỢI Ý CMT
                </button>
              </div>

              <button
                onClick={handleVisionGenerate}
                disabled={loading || !imagePreview}
                className="w-full mt-8 py-5 rounded-4xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-40 transition-all shadow-sm"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><UserSearch className="w-5 h-5 text-mint-300" /> PHÂN TÍCH NHÂN VẬT</>}
              </button>
            </>
          )}

          {activeTab === 'journal' && (
            <>
              <div className="flex items-center gap-2 mb-6 text-slate-600 font-bold">
                <div className="w-10 h-10 rounded-2xl bg-pink-soft flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-rose-400" />
                </div>
                <h2>Nhật ký trinh phục</h2>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="bg-mint-50/50 p-6 rounded-4xl border border-mint-100/30">
                  <label className="text-[11px] uppercase font-bold text-slate-400 tracking-widest block mb-4 px-1 text-center">Hôm nay bạn thấy thế nào?</label>
                  
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(mood.id)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          selectedMood === mood.id 
                            ? 'ring-2 ring-mint-400 ring-offset-2 scale-110 shadow-sm ' + mood.color
                            : 'bg-white text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <mood.icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newJournalContent}
                          onChange={(e) => setNewJournalContent(e.target.value)}
                          placeholder="Ghi nhanh kỷ niệm vừa rồi..."
                          className="flex-1 p-4 rounded-2xl bg-white border border-transparent focus:border-mint-200 outline-none transition-all text-sm font-medium shadow-sm"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddJournal()}
                        />
                        <label className="cursor-pointer p-4 bg-white text-slate-400 rounded-2xl hover:bg-slate-50 shadow-sm border border-transparent hover:border-mint-100 transition-all">
                          <ImageIcon className="w-6 h-6" />
                          <input type="file" accept="image/*" onChange={handleJournalImageChange} className="hidden" />
                        </label>
                        <button 
                          onClick={handleAddJournal}
                          className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all active:scale-95"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {newJournalImage && (
                        <div className="relative mt-3 inline-block">
                          <img src={newJournalImage} alt="Thumbnail preview" className="w-20 h-20 object-cover rounded-2xl border-2 border-white shadow-sm" />
                          <button 
                            onClick={() => setNewJournalImage(null)}
                            className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-sm hover:bg-rose-600 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative pl-10 pt-4 pb-4">
                  {/* Vertical Line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-mint-100" />
                  
                  <div className="space-y-8">
                    <AnimatePresence initial={false}>
                      {journalEntries.length === 0 ? (
                        <div className="text-center py-10 bg-white/40 rounded-4xl border-2 border-dashed border-slate-100">
                          <p className="text-slate-300 text-sm font-bold uppercase tracking-widest italic">Hãy viết chuơng đầu tiên...</p>
                        </div>
                      ) : (
                        journalEntries.slice().reverse().map((entry) => {
                          const MoodIcon = MOODS.find(m => m.id === entry.mood)?.icon || Smile;
                          const moodColor = MOODS.find(m => m.id === entry.mood)?.color || 'text-slate-400 bg-slate-50';
                          
                          return (
                            <motion.div 
                              key={entry.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="relative"
                            >
                              {/* Timeline Dot */}
                              <div className="absolute -left-[10px] top-4 w-5 h-5 rounded-full bg-white border-4 border-mint-400 z-10 shadow-sm" />
                              
                              <div className="flex items-center gap-4 p-5 bg-white rounded-4xl border border-slate-50 group shadow-sm hover:shadow-md transition-all">
                                <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shrink-0 ${moodColor}`}>
                                  <MoodIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{entry.timestamp}</p>
                                  </div>
                                  <p className="text-base text-slate-600 font-bold leading-tight mb-2">{entry.content}</p>
                                  {entry.image && (
                                    <div className="mt-2">
                                      <img src={entry.image} alt="Journal media" className="w-24 h-24 object-cover rounded-2xl border border-slate-100 shadow-sm" />
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => handleDeleteJournal(entry.id)}
                                  className="p-3 opacity-40 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all rounded-2xl hover:bg-rose-50"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <button
                onClick={handleJournalAnalyze}
                disabled={loading || journalEntries.length === 0}
                className="w-full py-5 rounded-4xl bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-40 transition-all shadow-sm"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-rose-300" /> GIẢI MÃ LỘ TRÌNH</>}
              </button>
            </>
          )}
        </motion.div>

        {/* Results Area */}
        <div ref={resultsRef} className="space-y-6">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                <div className="inline-flex gap-2 mb-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i} 
                      animate={{ 
                        y: [0, -15, 0],
                        scale: [1, 1.2, 1],
                        backgroundColor: ['#fed7e2', '#38b2ac', '#fed7e2']
                      }} 
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} 
                      className="w-4 h-4 rounded-full" 
                    />
                  ))}
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Đang dạo chơi trong tâm trí Crush...</p>
              </motion.div>
            )}

            {!loading && activeTab === 'reply' && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center gap-3 px-6">
                  <div className="h-px flex-1 bg-mint-100" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-mint-500 bg-white px-4 py-1 rounded-full border border-mint-100">Lời thoại gợi ý</span>
                  <div className="h-px flex-1 bg-mint-100" />
                </div>
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white rounded-4xl shadow-sm border border-white p-8 relative group hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-mint-50 flex items-center justify-center">
                          <span className="text-xs font-bold text-mint-500">{index + 1}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PHƯƠNG ÁN</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(suggestion.text, index)} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-4xl text-xs font-bold transition-all ${
                          copiedIndex === index 
                            ? 'bg-mint-500 text-white shadow-sm' 
                            : 'bg-mint-50 text-mint-500 hover:bg-mint-100'
                        }`}
                      >
                        {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} 
                        {copiedIndex === index ? 'ĐÃ CHÉP' : 'SAO CHÉP'}
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 leading-snug mb-6">{suggestion.text}</p>
                    <div className="flex items-start gap-3 p-4 rounded-3xl bg-mint-50/50 border border-mint-100/50 text-sm text-slate-500 font-medium italic">
                      <Info className="w-4 h-4 mt-1 shrink-0 text-mint-400" /> 
                      {suggestion.explanation}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {!loading && activeTab === 'date' && dateSuggestions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center gap-3 px-6">
                  <div className="h-px flex-1 bg-rose-100" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400 bg-white px-4 py-1 rounded-full border border-rose-100">Kịch bản hoàn hảo</span>
                  <div className="h-px flex-1 bg-rose-100" />
                </div>
                {dateSuggestions.map((item, index) => (
                  <div key={index} className="bg-white rounded-4xl shadow-sm border border-white overflow-hidden group hover:shadow-md transition-all">
                    <div className="bg-rose-50/50 px-8 py-4 border-b border-rose-100/50">
                      <span className="text-rose-400 font-bold text-xs uppercase tracking-widest">KẾ HOẠCH {index + 1}: {item.idea}</span>
                    </div>
                    <div className="p-8">
                      <div className="mb-6">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-widest block mb-1">Tin nhắn mồi</label>
                        <div className="relative mt-2">
                          <p className="text-xl font-bold text-slate-700 p-6 bg-rose-50/30 rounded-4xl border border-rose-100/50 leading-relaxed">{item.response}</p>
                          <button 
                            onClick={() => copyToClipboard(item.response, index + 100)} 
                            className="absolute right-4 top-4 p-3 bg-white rounded-3xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-all text-rose-400"
                          >
                            {copiedIndex === index + 100 ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-3xl bg-amber-50/50 border border-amber-100/50 text-sm text-amber-700 font-semibold italic">
                        <Sparkles className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" /> 
                        Mẹo: {item.tips}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {!loading && activeTab === 'journal' && journalAnalysis && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white rounded-4xl shadow-sm border border-white overflow-hidden p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-3xl bg-pink-soft flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-rose-400" />
                    </div>
                    <h3 className="font-bold text-2xl text-slate-800">Lộ trình tương lai</h3>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-pink-soft/50 p-6 rounded-4xl border border-pink-pastel/30">
                      <h4 className="text-[11px] uppercase font-bold text-rose-400 tracking-widest mb-3">Tình hình trái tim</h4>
                      <p className="text-slate-800 font-bold text-2xl leading-tight">{journalAnalysis.progress}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="bg-slate-800 p-6 rounded-4xl text-white shadow-sm">
                        <h4 className="text-pink-soft text-[11px] uppercase font-bold tracking-widest mb-3">Bước đi rực rỡ</h4>
                        <p className="font-bold text-lg leading-snug">{journalAnalysis.nextBestAction}</p>
                      </div>
                      <div className="bg-amber-50 p-6 rounded-4xl border border-amber-100/50">
                        <h4 className="text-amber-500 text-[11px] uppercase font-bold tracking-widest mb-3">Thời điểm vàng</h4>
                        <p className="text-slate-700 font-bold text-lg leading-tight">{journalAnalysis.suggestedTime}</p>
                      </div>
                    </div>

                    <div className="p-6 bg-mint-50/50 rounded-4xl border border-mint-100/50">
                      <h4 className="text-[11px] uppercase font-bold text-mint-500 tracking-widest mb-3">Tại sao là lúc này?</h4>
                      <p className="text-sm text-slate-500 font-semibold italic leading-relaxed">{journalAnalysis.reasoning}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!loading && activeTab === 'vision' && visionResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white rounded-4xl shadow-sm border border-white overflow-hidden p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-3xl bg-mint-100 flex items-center justify-center">
                      <UserSearch className="w-6 h-6 text-mint-500" />
                    </div>
                    <h3 className="font-bold text-2xl text-slate-800">Khám phá Profile</h3>
                  </div>
                  
                  <div className="bg-mint-50/50 rounded-4xl p-6 mb-10 border border-mint-100/50">
                    <h4 className="text-[11px] uppercase font-bold text-mint-500 tracking-widest mb-3">Bản tin phân tích</h4>
                    <p className="text-slate-700 leading-relaxed font-bold text-lg">{visionResult.analysis}</p>
                  </div>

                  {visionResult.suggestions.length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-widest px-2">
                        {visionMode === 'personality' ? 'CHỦ ĐỀ ĐỂ BẮT ĐẦU' : 'NHỮNG CÂU CMT CHẤT'}
                      </h4>
                      <div className="grid gap-4">
                        {visionResult.suggestions.map((suggestion, i) => (
                          <div key={i} className="group relative bg-white p-6 rounded-4xl border border-slate-50 hover:border-mint-200 transition-all shadow-sm">
                            <p className="text-slate-700 font-bold text-lg pr-14 leading-snug">{suggestion}</p>
                            <button 
                              onClick={() => copyToClipboard(suggestion, i + 200)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-3xl shadow-sm border border-white hover:bg-mint-50 transition-all text-mint-400"
                            >
                              {copiedIndex === i + 200 ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {!loading && activeTab === 'advice' && adviceHistory.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                {finalSummary && (
                  <div className="bg-slate-800 rounded-4xl shadow-xl p-10 text-white border-2 border-rose-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Zap className="w-32 h-32 text-rose-400" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-rose-400 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-400/20">
                          <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="font-bold text-3xl tracking-tight">KẾHOẠCH TỔNG LỰC</h3>
                      </div>
                      
                      <div className="mb-10 p-8 rounded-4xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <p className="text-2xl leading-snug font-bold text-rose-50 italic">"{finalSummary.finalStrategy}"</p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <h4 className="text-rose-300 text-[11px] uppercase font-bold tracking-widest px-1">ĐIỂM CHẠM TÂM LÝ</h4>
                          <ul className="space-y-4">
                            {finalSummary.keyInsights.map((insight, i) => (
                              <li key={i} className="flex items-start gap-4 text-base font-semibold text-slate-300 bg-white/5 p-4 rounded-3xl">
                                <div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-mint-300 text-[11px] uppercase font-bold tracking-widest px-1">BƯỚC ĐI TIẾP THEO</h4>
                          <ul className="space-y-4">
                            {finalSummary.nextSteps.map((step, i) => (
                              <li key={i} className="flex items-start gap-4 text-base font-semibold text-slate-300 bg-white/5 p-4 rounded-3xl">
                                <div className="w-2 h-2 rounded-full bg-mint-400 mt-2 shrink-0" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 px-6">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-white px-5 py-2 rounded-full border border-slate-100">QUÁ TRÌNH TRINH PHỤC</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {adviceHistory.slice().reverse().map((item, index) => (
                  <div key={index} className="bg-white rounded-4xl shadow-sm border border-slate-50 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-mint-50 rounded-3xl flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-mint-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">TÌNH HUỐNG</p>
                          <p className="text-lg font-bold text-slate-600 leading-tight">{item.context}</p>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-mint-500 font-bold text-[11px] uppercase tracking-widest">
                            <Check className="w-4 h-4" /> NÊN LÀM
                          </h4>
                          <ul className="space-y-3">
                            {item.advice.dos.map((doItem, i) => (
                              <li key={i} className="text-sm text-slate-500 font-bold flex items-start gap-3 bg-mint-50/30 p-3 rounded-2xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-mint-400 mt-1.5 shrink-0" />
                                {doItem}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-rose-400 font-bold text-[11px] uppercase tracking-widest">
                            <XCircle className="w-4 h-4" /> NÊN TRÁNH
                          </h4>
                          <ul className="space-y-3">
                            {item.advice.donts.map((dontItem, i) => (
                              <li key={i} className="text-sm text-slate-500 font-bold flex items-start gap-3 bg-rose-50/30 p-3 rounded-2xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                {dontItem}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-slate-800 rounded-4xl p-8 shadow-sm">
                        <h4 className="text-[10px] uppercase font-bold text-pink-soft tracking-widest mb-3 leading-none">CHIẾN THUẬT</h4>
                        <p className="text-lg leading-relaxed text-white font-bold italic">"{item.advice.strategy}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <footer className="mt-20 text-center text-slate-400 px-8">
          <p className="text-xs leading-relaxed">
            Mẹo: Sự chân thành và tôn trọng đối phương là chìa khóa quan trọng nhất.<br/>
            Crush Buddy luôn đồng hành cùng bạn! ❤️
          </p>
        </footer>
      </div>
    </div>
  );
}
