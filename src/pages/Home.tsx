import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Subject, WebsiteConfig, CourseData } from '../types';
import { API, AppStorage } from '../lib/api';
import { BookOpen, AlertCircle, RefreshCw, Lock, Info, ChevronRight } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import CourseView from '../components/CourseView';
import SubjectSelector from '../components/SubjectSelector';

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
            className="app-container relative"
        >
            <AnimatePresence mode="wait">
                {isOffline && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-500 text-white text-[10px] md:text-xs font-black py-1.5 text-center flex items-center justify-center gap-2 sticky top-0 md:relative z-50 uppercase tracking-widest shadow-lg shadow-amber-500/20"
                    >
                        <AlertCircle size={14} fill="currentColor" className="text-amber-500 bg-white rounded-full p-0.5" />
                        You are in offline mode. Some content may be unavailable.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Header */}
            <AnimatePresence>
                {showStickyHeader && activeSubject && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-2 md:py-3"
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
                                {config?.subjects?.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => navigate(`/?subject=${s.slug}`)}
                                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                                            s.id === activeSubject.id
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeSubject && courseData ? (
                <CourseView 
                    data={courseData} 
                    subject={activeSubject} 
                    syncing={syncing}
                    onRetry={() => fetchFreshData(activeSubject)}
                    error={error}
                    isOffline={isOffline}
                />
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

            {config?.subjects && (
                <SubjectSelector 
                    subjects={config.subjects} 
                    activeId={activeSubject?.id || ''} 
                />
            )}
        </motion.div>
    );
};

export default Home;
