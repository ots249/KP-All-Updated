import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Subject, WebsiteConfig, CourseData } from '../types';
import { API, AppStorage } from '../lib/api';
import { BookOpen, AlertCircle, RefreshCw, Lock, Download, Sparkles, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import CourseView from '../components/CourseView';
import SubjectSelector from '../components/SubjectSelector';
import { usePWAInstall } from '../hooks/usePWAInstall';

const Home: React.FC = () => {
    const [config, setConfig] = useState<WebsiteConfig | null>(AppStorage.get<WebsiteConfig>('website_config'));
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
    const [courseData, setCourseData] = useState<CourseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showStickyHeader, setShowStickyHeader] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const { canInstall, install } = usePWAInstall();
    const [isPromptDismissed, setIsPromptDismissed] = useState(AppStorage.get<boolean>('pwa_prompt_dismissed') || false);

    // Offline event listeners
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Scroll listener for sticky header
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 200) {
                setShowStickyHeader(true);
            } else {
                setShowStickyHeader(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Initial load - Cache First then Refresh
    useEffect(() => {
        // 1. Try to load from cache immediately
        const cachedConfig = AppStorage.get<WebsiteConfig>('website_config');
        if (cachedConfig) {
            setConfig(cachedConfig);
            setLoading(false);
        }
        
        // 2. Refresh from network
        loadConfig();
        
        // 3. Listen for real-time updates
        const unsubConfig = API.onConfigUpdate((freshConfig) => {
            setConfig(freshConfig);
            AppStorage.set('website_config', freshConfig);
            setLoading(false);
        });

        return () => {
            if (unsubConfig) unsubConfig();
        };
    }, []);

    const loadConfig = async () => {
        try {
            const freshConfig = await API.fetchConfig();
            setConfig(freshConfig);
            AppStorage.set('website_config', freshConfig);
        } catch (err) {
            console.warn('Network fetch failed, using cache if available');
        } finally {
            setLoading(false);
        }
    };

    // Determine active subject from URL or config
    useEffect(() => {
        if (!config || !config.subjects?.length) return;
        
        const slug = searchParams.get('subject');
        
        let subject = config.subjects.find(s => s.slug === slug);
        if (!subject && config.defaultSubjectId) {
            subject = config.subjects.find(s => s.id === config.defaultSubjectId);
        }
        if (!subject) subject = config.subjects[0];
        
        setActiveSubject(subject);
    }, [config, searchParams]);

    // Cache-First fetching for course data
    useEffect(() => {
        if (!activeSubject) return;

        const dataKey = `courseDataCache_${activeSubject.apiUrl}`;
        const cached = AppStorage.get<CourseData>(dataKey);
        if (cached) {
            setCourseData(cached);
        }

        fetchFreshData(activeSubject);
    }, [activeSubject]);

    const fetchFreshData = async (subject: Subject) => {
        setSyncing(true);
        setError(null);
        try {
            const freshData = await API.fetchCourseData(subject.apiUrl);
            setCourseData(freshData);
            AppStorage.set(`courseDataCache_${subject.apiUrl}`, freshData);
        } catch (err) {
            if (!courseData) {
                setError(`${subject.name} লোড করতে সমস্যা হয়েছে`);
            }
        } finally {
            setSyncing(false);
        }
    };

    if (loading && !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-text-light">লোডিং হচ্ছে...</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row relative"
        >
            {/* Desktop/Tablet Sidebar */}
            <aside className="hidden md:flex flex-col w-72 lg:w-80 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex-shrink-0 z-40">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none rotate-3">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="font-black text-xl text-slate-800 dark:text-white leading-tight">Master</h1>
                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Education App</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-4 px-2">Courses</p>
                    {config?.subjects?.map((s) => {
                        const isActive = s.id === activeSubject?.id;
                        return (
                            <motion.button
                                key={s.id}
                                onClick={() => navigate(`/?subject=${s.slug}`)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                                    isActive 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700'
                                }`}>
                                    {s.name.charAt(0)}
                                </div>
                                <span className="font-black text-sm">{s.name}</span>
                                {isActive && <motion.div layoutId="activeInd" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                            </motion.button>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
                    >
                        <Lock size={18} /> Admin Access
                    </button>
                    <div className="text-[10px] text-slate-400 font-medium px-3">
                        Version 2.1.0 • © 2026
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {isOffline && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-amber-500 text-white text-[10px] md:text-xs font-black py-1.5 text-center flex items-center justify-center gap-2 sticky top-0 z-50 uppercase tracking-widest shadow-lg shadow-amber-500/20"
                        >
                            <AlertCircle size={14} fill="currentColor" className="text-amber-500 bg-white rounded-full p-0.5" />
                            You are in offline mode. Some content may be unavailable.
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sticky Header - Mobile only */}
                <AnimatePresence>
                    {showStickyHeader && activeSubject && (
                        <motion.div 
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-2 md:py-3 md:hidden"
                        >
                            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
                                        <BookOpen size={18} className="md:w-5 md:h-5" />
                                    </div>
                                    <h2 className="font-black text-sm md:text-lg text-slate-800 dark:text-white truncate">
                                        {activeSubject.name}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                    {config?.subjects?.map((s, idx) => (
                                        <motion.button 
                                            key={s.id}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => navigate(`/?subject=${s.slug}`)}
                                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                                                s.id === activeSubject.id
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {s.name}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PWA Install Prompt */}
                <AnimatePresence>
                    {canInstall && !isPromptDismissed && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="px-4 pt-4 md:pt-6 max-w-6xl mx-auto w-full"
                        >
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-5 md:p-8 lg:p-12 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

                                <button 
                                    onClick={() => {
                                        setIsPromptDismissed(true);
                                        AppStorage.set('pwa_prompt_dismissed', true);
                                    }}
                                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="relative flex flex-col md:flex-row items-center gap-6 lg:gap-10">
                                    <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 text-white">
                                        <Sparkles size={32} className="text-amber-300 lg:w-12 lg:h-12" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-2 lg:space-y-4">
                                        <h3 className="text-xl md:text-2xl lg:text-4xl font-black">প্লে-স্টোর অ্যাপের মতো ব্যবহার করুন!</h3>
                                        <p className="text-white/80 font-medium text-sm md:text-base lg:text-lg">
                                            সহজে এবং দ্রুত অ্যাক্সেস করতে আপনার ফোনে অ্যাপটি ইন্সটল করে নিন।
                                        </p>
                                    </div>
                                    <button 
                                        onClick={install}
                                        className="bg-white text-indigo-600 px-8 py-3 md:py-4 lg:px-12 lg:text-lg rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
                                    >
                                        <Download size={20} /> ইন্সটল করুন
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 max-w-6xl mx-auto w-full lg:px-10 lg:py-8 pb-20">
                    {activeSubject && courseData ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                        >
                            <CourseView 
                                data={courseData} 
                                subject={activeSubject} 
                                syncing={syncing}
                                onRetry={() => fetchFreshData(activeSubject)}
                                error={error}
                                isOffline={isOffline}
                            />
                        </motion.div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <AlertCircle size={48} className="text-danger" />
                            <h2 className="text-xl font-bold">{error}</h2>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => activeSubject && fetchFreshData(activeSubject)}
                                    className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
                                >
                                    <RefreshCw size={18} /> আবার চেষ্টা করুন
                                </button>
                                <button 
                                    onClick={() => navigate('/admin')}
                                    className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg"
                                >
                                    এ্যাডমিন প্যানেল
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <p className="text-slate-500 mb-6 font-medium">কোনো কোর্স পাওয়া যায়নি</p>
                            <button 
                                onClick={() => navigate('/admin')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1"
                            >
                                <Lock size={20} /> এ্যাডমিন প্যানেল
                            </button>
                        </div>
                    )}
                </div>

                <div className="md:hidden">
                    {config?.subjects && (
                        <SubjectSelector 
                            subjects={config.subjects} 
                            activeId={activeSubject?.id || ''} 
                        />
                    )}
                </div>
            </main>
        </motion.div>
    );
};

export default Home;
