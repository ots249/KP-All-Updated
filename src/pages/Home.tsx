import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject, CourseData } from '../types';
import { AppStorage } from '../lib/api';
import { BookOpen, AlertCircle, Lock, Download, Sparkles, X, RefreshCw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CourseView from '../components/CourseView';
import SubjectSelector from '../components/SubjectSelector';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useConfig, useCourseData } from '../hooks/useCourseQueries';

const Home: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // React Query Hooks
    const { data: config, isLoading: isConfigLoading, refetch: refetchConfig } = useConfig();
    const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
    const { data: courseData, isFetching: isDataSyncing, error: dataError, refetch: refetchCourse } = useCourseData(activeSubject?.apiUrl);

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
        const handleScroll = () => setShowStickyHeader(window.scrollY > 200);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    if (isConfigLoading && !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4" aria-live="polite">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">লোডিং হচ্ছে...</p>
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
            <aside 
                className="hidden md:flex flex-col w-72 lg:w-80 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex-shrink-0 z-40"
                aria-label="Sidebar Navigation"
            >
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="font-black text-xl text-slate-800 dark:text-white leading-tight">Master</h1>
                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Education App</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-4 px-2">Courses</p>
                    {config?.subjects?.map((s) => {
                        const isActive = s.id === activeSubject?.id;
                        return (
                            <motion.button
                                key={s.id}
                                onClick={() => navigate(`/?subject=${s.slug}`)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                aria-current={isActive ? 'page' : undefined}
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
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
                        aria-label="Admin Access"
                    >
                        <Lock size={18} /> Admin Access
                    </button>
                    <div className="text-[10px] text-slate-400 font-medium px-3">
                        Version 2.2.0 • © 2026
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {isOffline && (
                        <motion.div 
                            role="alert"
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
                        <motion.header 
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

                                <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1" aria-label="Subject quick selection">
                                    {config?.subjects?.map((s, idx) => (
                                        <motion.button 
                                            key={s.id}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => navigate(`/?subject=${s.slug}`)}
                                            aria-pressed={s.id === activeSubject.id}
                                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                                                s.id === activeSubject.id
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {s.name}
                                        </motion.button>
                                    ))}
                                </nav>
                            </div>
                        </motion.header>
                    )}
                </AnimatePresence>

                {/* PWA Install Prompt */}
                <AnimatePresence>
                    {canInstall && !isPromptDismissed && (
                        <aside className="px-4 pt-4 md:pt-6 max-w-6xl mx-auto w-full" aria-label="Install Prompt">
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:px-8 md:py-6 text-slate-800 dark:text-white relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                                <button 
                                    onClick={() => {
                                        setIsPromptDismissed(true);
                                        AppStorage.set('pwa_prompt_dismissed', true);
                                    }}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                                    aria-label="Dismiss prompt"
                                >
                                    <X size={18} />
                                </button>

                                <div className="relative flex flex-col md:flex-row items-center gap-5">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0 text-indigo-600">
                                        <Download size={24} />
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-1">
                                        <h3 className="text-lg md:text-xl font-black">আমাদের অ্যাপটি ব্যবহার করুন</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm">
                                            সহজ এবং দ্রুত অ্যাক্সেস পেতে আপনার ডিভাইসের হোম স্ক্রিনে অ্যাপটি যুক্ত করুন।
                                        </p>
                                    </div>
                                    <button 
                                        onClick={install}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                                    >
                                        ইন্সটল করুন
                                    </button>
                                </div>
                            </motion.div>
                        </aside>
                    )}
                </AnimatePresence>

                <section className="flex-1 max-w-6xl mx-auto w-full lg:px-10 lg:py-8 pb-20">
                    {activeSubject && courseData ? (
                        <motion.div
                            key={activeSubject.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CourseView 
                                data={courseData} 
                                subject={activeSubject} 
                                subjects={config?.subjects || []}
                                syncing={isDataSyncing}
                                onRetry={() => refetchCourse()}
                                onSubjectChange={(slug) => navigate(`/?subject=${slug}`)}
                                error={dataError instanceof Error ? dataError.message : null}
                                isOffline={isOffline}
                            />
                        </motion.div>
                    ) : dataError ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4" role="alert">
                            <AlertCircle size={48} className="text-rose-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">লোড করতে সমস্যা হচ্ছে</h2>
                            <p className="text-slate-500 max-w-xs mx-auto">ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।</p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => refetchCourse()}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    <RefreshCw size={18} /> আবার চেষ্টা করুন
                                </button>
                                <button 
                                    onClick={() => navigate('/admin')}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold"
                                >
                                    এ্যাডমিন প্যানেল
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 mb-6">
                                <BookOpen size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">কোনো কোর্স পাওয়া যায়নি</h3>
                            <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">হয়তো কোনো সেটিংস পরিবর্তন হয়েছে অথবা আপনার কানেকশন স্ট্যাবল নয়।</p>
                            <button 
                                onClick={() => navigate('/admin')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                            >
                                <Lock size={20} /> এ্যাডমিন প্যানেল
                            </button>
                        </div>
                    )}
                </section>

                <aside className="md:hidden">
                    {config?.subjects && (
                        <SubjectSelector 
                            subjects={config.subjects} 
                            activeId={activeSubject?.id || ''} 
                        />
                    )}
                </aside>
            </main>
        </motion.div>
    );
};

export default Home;
