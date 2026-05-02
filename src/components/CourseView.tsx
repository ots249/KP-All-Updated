import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { API, AppStorage } from '../lib/api';
import { WebsiteConfig, Subject, CourseData, CourseSection, CourseContent } from '../types';
import { ChevronRight, CheckCircle2, Circle, FileText, Youtube, Video, MessageCircle, Clock, AlertCircle, RefreshCw, Settings, WifiOff, Cloud, Search, X, Star } from 'lucide-react';
import MediaViewer from './MediaViewer';
import { extractYouTubeVideoId, getVideoDuration } from '../lib/youtube';

const VideoDuration: React.FC<{ url: string }> = ({ url }) => {
    const [duration, setDuration] = useState<string>('--:--');

    useEffect(() => {
        const id = extractYouTubeVideoId(url);
        if (id) {
            getVideoDuration(id).then(setDuration);
        }
    }, [url]);

    const isLive = duration === 'LIVE';

    return (
        <div className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-black tracking-tighter ${
            isLive 
            ? 'bg-rose-500 text-white animate-pulse' 
            : 'bg-slate-100 dark:bg-slate-800 text-text-light'
        }`}>
            {duration}
        </div>
    );
};

const resolveLink = (item: CourseContent): string => {
    if (item.resource) {
        if (item.resource.resourceable && item.resource.resourceable.link) {
            return item.resource.resourceable.link;
        } 
        if (item.resource.link) {
            return item.resource.link;
        }
    } 
    return item.link || '';
};

interface Props {
  data: CourseData;
  subject: Subject;
  syncing: boolean;
  onRetry: () => void;
  error: string | null;
  isOffline?: boolean;
}

const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800" />
            ))}
        </div>
    </div>
);

const CourseView: React.FC<Props> = ({ data, subject, syncing, onRetry, error, isOffline }) => {
    const [activeSectionId, setActiveSectionId] = useState<string | number | null>(data.sections[0]?.id || 2026);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [completionMap, setCompletionMap] = useState<Record<string, boolean>>(() => 
        AppStorage.get<Record<string, boolean>>(`completedItems_${subject.apiUrl}`) || {}
    );
    const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>(() => 
        AppStorage.get<Record<string, boolean>>(`favoritesItems_${subject.apiUrl}`) || {}
    );
    const [activeMedia, setActiveMedia] = useState<{ url: string, type: 'video' | 'pdf' | 'other', title: string } | null>(null);

    // Filtered sections and contents based on search and favorites
    const filteredSections = useMemo(() => {
        let sections = data.sections;

        if (showOnlyFavorites) {
            sections = sections.map(section => ({
                ...section,
                contents: section.contents.filter(item => favoritesMap[item.id])
            })).filter(section => section.contents.length > 0);
        }

        if (!searchTerm.trim()) return sections;

        const term = searchTerm.toLowerCase().trim();
        return sections.map(section => {
            const matchesSection = section.title.toLowerCase().includes(term);
            const filteredContents = section.contents.filter(item => 
                item.title.toLowerCase().includes(term)
            );

            if (matchesSection || filteredContents.length > 0) {
                return {
                    ...section,
                    contents: matchesSection ? section.contents : filteredContents,
                    isSearchMatch: true
                };
            }
            return null;
        }).filter(Boolean) as (CourseSection & { isSearchMatch?: boolean })[];
    }, [data.sections, searchTerm, showOnlyFavorites, favoritesMap]);

    useEffect(() => {
        // Auto-expand sections when searching
        if ((searchTerm.trim() || showOnlyFavorites) && filteredSections.length > 0) {
            setActiveSectionId(filteredSections[0].id || 0);
        }
    }, [searchTerm, filteredSections, showOnlyFavorites]);

    useEffect(() => {
        AppStorage.set(`completedItems_${subject.apiUrl}`, completionMap);
    }, [completionMap, subject.apiUrl]);

    useEffect(() => {
        AppStorage.set(`favoritesItems_${subject.apiUrl}`, favoritesMap);
    }, [favoritesMap, subject.apiUrl]);

    const toggleSection = (id: string | number) => {
        setActiveSectionId(prev => (prev === id ? null : id));
    };

    const toggleComplete = (itemId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompletionMap(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const toggleFavorite = (itemId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavoritesMap(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const getIcon = (item: CourseContent) => {
        const title = item.title.toLowerCase();
        const link = resolveLink(item).toLowerCase();
        
        if (item.type === 'pdf' || title.includes('pdf') || link.includes('.pdf')) return <FileText size={18} className="text-[#F40F02]" />;
        if (title.includes('doc') || link.includes('.doc') || link.includes('.docx')) return <FileText size={18} className="text-[#2B579A]" />;
        if (item.type === 'video' || title.includes('video') || link.includes('youtube') || link.includes('youtu.be')) return <Youtube size={20} className="text-[#FF0000] fill-[#FF0000]/10" />;
        if (item.type === 'live') return <Video size={18} className="text-indigo-600" />;
        if (title.includes('whatsapp') || link.includes('whatsapp')) return <MessageCircle size={18} className="text-[#25D366] fill-[#25D366]/10" />;
        return <FileText size={18} className="text-indigo-600" />;
    };

    const handleItemClick = (item: CourseContent) => {
        const link = resolveLink(item);
        if (!link) return;

        const title = item.title.toLowerCase();
        const url = link.toLowerCase();
        
        let type: 'video' | 'pdf' | 'other' = 'other';
        if (item.type === 'video' || title.includes('video') || url.includes('youtube') || url.includes('youtu.be')) {
            type = 'video';
        } else if (item.type === 'pdf' || title.includes('pdf') || url.includes('.pdf')) {
            type = 'pdf';
        }

        if (type !== 'other') {
            setActiveMedia({ url: link, type, title: item.title });
        } else {
            window.open(link, '_blank');
        }
    };

    // Calculate progress
    const totalItems = data.sections.reduce((acc, s) => acc + s.contents.length, 0);
    const completedItemsCount = Object.values(completionMap).filter(Boolean).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItemsCount / totalItems) * 100) : 0;

    const [clickCount, setClickCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (clickCount >= 5) {
            navigate('/admin');
            setClickCount(0);
        }
    }, [clickCount, navigate]);

    const handleSecretClick = () => {
        setClickCount(prev => prev + 1);
    };

    return (
        <div className="flex-1 flex flex-col bg-bg transition-colors duration-300">
            <div className="relative p-4">
                <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-lg relative group">
                    {data.image?.link && (
                        <img 
                            src={data.image.link} 
                            alt="Course Banner" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    )}
                    {syncing && (
                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest">
                            <RefreshCw size={10} className="animate-spin" />
                            Syncing
                        </div>
                    )}
                    {isOffline && (
                        <div className="absolute top-4 right-4 bg-amber-500/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-[10px] text-white font-bold uppercase tracking-widest shadow-lg">
                            <WifiOff size={10} />
                            Offline Mode
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 py-2">
                <div className="bg-card-bg p-8 rounded-[2rem] shadow-sm border border-border flex flex-col items-center text-center">
                    <h1 
                        onClick={handleSecretClick}
                        className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-tight mb-4 select-none cursor-default active:scale-[0.98] transition-all"
                    >
                        {data.title}
                    </h1>
                    <p className="text-sm text-text-light font-medium flex items-center gap-2">
                        {data.subtitle || 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং • ৩য় সেমিস্টার'}
                    </p>
                </div>
            </div>

            <div className="px-4 py-2 flex gap-3">
                <div className="relative group flex-1">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="লেকচার বা নোটের নাম দিয়ে সার্চ করুন..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-sm"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 hover:text-rose-500 transition-all"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${
                        showOnlyFavorites 
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' 
                        : 'bg-white dark:bg-slate-800 border-border text-slate-400 hover:text-amber-500'
                    }`}
                    title={showOnlyFavorites ? "সবগুলো দেখুন" : "পছন্দসইগুলো দেখুন"}
                >
                    <Star size={24} fill={showOnlyFavorites ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="px-4 py-2">
                <div className="bg-card-bg px-5 py-4 rounded-2xl shadow-sm border border-border flex items-center justify-between">
                    <span className="text-[15px] font-bold text-text">সর্বমোট অগ্রগতি</span>
                    <div className="flex-1 px-4">
                        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-indigo-600 rounded-full"
                            />
                        </div>
                    </div>
                    <span className="text-[15px] font-black text-indigo-600 dark:text-indigo-400 min-w-[35px] text-right">{progressPercent}%</span>
                </div>
            </div>

            <div className="px-4 py-2 space-y-4 pb-24">
                {syncing && filteredSections.length === 0 ? (
                    <SkeletonLoader />
                ) : filteredSections.length === 0 ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <Search size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-800 dark:text-white">কোনো ফলাফল পাওয়া যায়নি</h3>
                            <p className="text-sm text-slate-500">অন্য কোনো নাম দিয়ে চেষ্টা করুন</p>
                        </div>
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="text-indigo-600 font-bold text-sm"
                        >
                            সবগুলো দেখুন
                        </button>
                    </div>
                ) : (
                    filteredSections.map((section, idx) => {
                        const isExpanded = activeSectionId === (section.id || idx);
                        const completedInSection = section.contents.filter(c => completionMap[c.id]).length;
                        
                        return (
                            <motion.div 
                                key={section.id || idx} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-card-bg rounded-3xl shadow-sm border border-border overflow-hidden transition-all"
                            >
                                <button 
                                    onClick={() => toggleSection(section.id || idx)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-90 shadow-lg shadow-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600'}`}>
                                            <ChevronRight size={20} />
                                        </div>
                                        <h3 className="font-bold text-[16px] text-text leading-tight group-hover:text-indigo-600 transition-colors">
                                            {section.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden xs:block">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(completedInSection / section.contents.length) * 100}%` }}
                                                className="h-full bg-indigo-200 dark:bg-indigo-900 rounded-full" 
                                            />
                                        </div>
                                        <span className="text-xs font-black text-success/80 min-w-[30px] text-right">
                                            {completedInSection}/{section.contents.length}
                                        </span>
                                    </div>
                                </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-slate-50/30 dark:bg-slate-900/10"
                                    >
                                        <div className="p-4 pt-0 space-y-2">
                                            {section.contents.map((item, cIdx) => {
                                                const isDone = completionMap[item.id];
                                                const link = resolveLink(item);
                                                const isYouTube = item.type === 'video' || item.title.toLowerCase().includes('video') || link.toLowerCase().includes('youtube') || link.toLowerCase().includes('youtu.be');
                                                const isPDF = item.type === 'pdf' || item.title.toLowerCase().includes('pdf') || link.toLowerCase().includes('.pdf');
                                                
                                                return (
                                                    <motion.div 
                                                        key={item.id || cIdx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: cIdx * 0.04, duration: 0.3 }}
                                                        onClick={() => handleItemClick(item)}
                                                        className={`p-4 rounded-2xl border border-border transition-all flex items-center gap-4 cursor-pointer shadow-sm group active:scale-[0.98] ${
                                                            isDone 
                                                            ? 'bg-slate-50/50 dark:bg-slate-900/50 opacity-60' 
                                                            : 'bg-card-bg hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:shadow-md'
                                                        }`}
                                                    >
                                                        <div 
                                                            onClick={(e) => toggleComplete(item.id, e)}
                                                            className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
                                                                isDone ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
                                                            }`}
                                                        >
                                                            {isDone && <CheckCircle2 size={16} className="text-white" />}
                                                        </div>
                                                        
                                                        <div className="shrink-0 scale-110">
                                                            {getIcon(item)}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[15px] font-bold text-text line-clamp-1">
                                                                {item.title}
                                                            </div>
                                                            {isPDF && (
                                                                <motion.div 
                                                                    animate={{ opacity: [1, 0.5, 1] }}
                                                                    transition={{ duration: 2, repeat: Infinity }}
                                                                    className="flex items-center gap-1 mt-0.5 text-[#10b981] text-[9px] font-black uppercase tracking-tighter"
                                                                >
                                                                    <Cloud size={10} fill="currentColor" className="opacity-50" />
                                                                    <span>Offline Available</span>
                                                                </motion.div>
                                                            )}
                                                        </div>
 
                                                        {isYouTube && (
                                                            <VideoDuration url={link} />
                                                        )}

                                                        <button 
                                                            onClick={(e) => toggleFavorite(item.id, e)}
                                                            className={`p-2 transition-all hover:scale-110 active:scale-95 ${
                                                                favoritesMap[item.id] ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                                                            }`}
                                                        >
                                                            <Star size={18} fill={favoritesMap[item.id] ? "currentColor" : "none"} />
                                                        </button>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {activeMedia && (
                <MediaViewer 
                    url={activeMedia.url} 
                    type={activeMedia.type} 
                    title={activeMedia.title}
                    onClose={() => setActiveMedia(null)} 
                />
            )}
        </div>
    );
};

export default CourseView;
