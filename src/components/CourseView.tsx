import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, motionValue, useTransform, animate } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { API, AppStorage } from '../lib/api';
import { WebsiteConfig, Subject, CourseData, CourseSection, CourseContent } from '../types';
import { ChevronRight, CheckCircle2, Circle, FileText, Youtube, Video, MessageCircle, Clock, AlertCircle, RefreshCw, Settings, WifiOff, Cloud, Search, X, Star, Lock } from 'lucide-react';
import MediaViewer from './MediaViewer';
import { extractYouTubeVideoId, getVideoDuration } from '../lib/youtube';
import { checkLiveContent, LiveDetails, isItemNew } from '../lib/liveCheck';

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
  subjects: Subject[];
  syncing: boolean;
  onRetry: () => void;
  onSubjectChange: (slug: string) => void;
  error: string | null;
  isOffline?: boolean;
  apiAuthorization?: string;
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

const CourseItem: React.FC<{
    item: CourseContent;
    cIdx: number;
    isDone: boolean;
    isFavorite: boolean;
    isPDF: boolean;
    isYouTube: boolean;
    link: string;
    onToggleComplete: () => void;
    onToggleFavorite: () => void;
    onClick: () => void;
    getIcon: (item: CourseContent) => React.ReactNode;
    searchTerm: string;
    isOffline?: boolean;
    isLocked?: boolean;
    isLoading?: boolean;
}> = ({ item, cIdx, isDone, isFavorite, isPDF, isYouTube, link, onToggleComplete, onToggleFavorite, onClick, getIcon, searchTerm, isOffline, isLocked, isLoading }) => {
    const x = motionValue(0);

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) => 
            regex.test(part) ? (
                <mark key={i} className="bg-amber-200 dark:bg-amber-500/40 text-amber-900 dark:text-white rounded px-0.5">
                    {part}
                </mark>
            ) : part
        );
    };

    const handleDownload = (e: React.MouseEvent, url: string, title: string) => {
        e.stopPropagation();
        if (isLocked) return;
        if (isOffline) {
            alert('You are currently offline. The file will be available for download once you are back online.');
            return;
        }
        
        const linkElem = document.createElement('a');
        linkElem.href = url;
        linkElem.download = `${title}.pdf`;
        document.body.appendChild(linkElem);
        linkElem.click();
        document.body.removeChild(linkElem);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isLocked) onClick();
        }
    };
    
    // Smooth visual feedback transforms
    const favoriteOpacity = useTransform(x, [0, 60], [0, 1]);
    const favoriteScale = useTransform(x, [0, 100], [0.8, 1.2]);
    const favoriteTranslate = useTransform(x, [0, 100], [-20, 0]);
    
    const completeOpacity = useTransform(x, [0, -60], [0, 1]);
    const completeScale = useTransform(x, [0, -100], [0.8, 1.2]);
    const completeTranslate = useTransform(x, [0, -100], [20, 0]);

    const itemRotate = useTransform(x, [-100, 100], [-2, 2]);
    const itemScale = useTransform(x, [-100, 0, 100], [0.98, 1, 0.98]);

    return (
        <div className="relative overflow-hidden rounded-2xl group/swipe bg-slate-100 dark:bg-slate-900/50">
            {/* Swipe Background Layer */}
            {!isLocked && (
                <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none" aria-hidden="true">
                    <motion.div 
                        style={{ 
                            opacity: favoriteOpacity, 
                            scale: favoriteScale,
                            x: favoriteTranslate
                        }}
                        className="flex flex-col items-center gap-1 text-amber-500"
                    >
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shadow-lg shadow-amber-200/20">
                            <Star size={24} fill="currentColor" />
                        </div>
                        <span className="font-black text-[9px] uppercase tracking-tighter">Favorite</span>
                    </motion.div>
                    
                    <motion.div 
                        style={{ 
                            opacity: completeOpacity, 
                            scale: completeScale,
                            x: completeTranslate
                        }}
                        className="flex flex-col items-center gap-1 text-indigo-600"
                    >
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200/20">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="font-black text-[9px] uppercase tracking-tighter">Complete</span>
                    </motion.div>
                </div>
            )}

            <motion.div 
                drag={!isLocked ? "x" : false}
                style={{ x, rotate: itemRotate, scale: itemScale }}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    const threshold = 100;
                    if (info.offset.x > threshold) {
                        onToggleFavorite();
                    } else if (info.offset.x < -threshold) {
                        onToggleComplete();
                    }
                    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: cIdx * 0.04, duration: 0.3 }}
                onClick={(e) => {
                    if (isLoading) return;
                    if (isLocked) {
                        alert('এই ক্লাসটি লক করা আছে। এটি দেখার জন্য আপনাকে কোর্সটি সাবস্ক্রাইব করতে হবে।');
                        return;
                    }
                    if (Math.abs(x.get()) < 5) onClick();
                }}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-pressed={isDone}
                aria-label={`${item.title}, ${isDone ? 'completed' : 'uncompleted'}${isLocked ? ', locked' : ''}${isLoading ? ', loading' : ''}`}
                className={`p-4 rounded-2xl border border-border transition-all flex items-center gap-4 cursor-pointer shadow-sm group active:scale-[0.98] outline-none focus:ring-2 focus:ring-indigo-600 relative z-10 ${
                    isLoading
                    ? 'bg-slate-50 dark:bg-slate-900 opacity-70 cursor-wait border-indigo-200'
                    : isLocked
                    ? 'bg-slate-50 dark:bg-slate-900 opacity-80 border-slate-200 dark:border-slate-800'
                    : isDone 
                    ? 'bg-slate-50/50 dark:bg-white/5 opacity-60' 
                    : 'bg-card-bg hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:shadow-md'
                }`}
            >
                {isLoading ? (
                    <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-indigo-600">
                        <RefreshCw size={14} className="animate-spin" />
                    </div>
                ) : isLocked ? (
                    <div className="shrink-0 w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Lock size={14} />
                    </div>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
                        aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
                        className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
                            isDone ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                        {isDone && <CheckCircle2 size={16} className="text-white" />}
                    </button>
                )}
                
                <div className="shrink-0 scale-110" aria-hidden="true">
                    {isLoading ? (
                        <RefreshCw size={18} className="animate-spin text-indigo-600" />
                    ) : isLocked ? (
                        <Lock size={18} className="text-slate-400" />
                    ) : (
                        getIcon(item)
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-snug break-words">
                        {highlightText(item.title, searchTerm)}
                        {isItemNew(item.available_from || item.resource?.resourceable?.start_time) && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-md inline-block align-middle transform -translate-y-0.5">
                                NEW
                            </span>
                        )}
                        {isLocked && (
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase rounded-md inline-block align-middle transform -translate-y-0.5">
                                PAID
                            </span>
                        )}
                    </div>
                    {isPDF && !isLocked && (
                        <div className="flex items-center gap-3 mt-1.5">
                            <motion.div 
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="flex items-center gap-1 text-[#10b981] text-[9px] font-black uppercase tracking-tighter"
                            >
                                <Cloud size={10} fill="currentColor" className="opacity-50" />
                                <span>Offline Available</span>
                            </motion.div>
                            <button 
                                onClick={(e) => handleDownload(e, link || '', item.title)}
                                aria-label={`Download PDF: ${item.title}`}
                                className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-md text-[9px] font-black uppercase transition-colors"
                            >
                                <Cloud size={10} />
                                Download
                            </button>
                        </div>
                    )}
                </div>

                {isYouTube && !isLocked && (
                    <VideoDuration url={link} />
                )}

                {!isLocked && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        className={`p-2 transition-all hover:scale-110 active:scale-95 ${
                            isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                        }`}
                    >
                        <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                )}
            </motion.div>
        </div>
    );
};

const CourseView: React.FC<Props> = ({ data, subject, subjects, syncing, onRetry, onSubjectChange, error, isOffline, apiAuthorization }) => {
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
    const [loadingItemId, setLoadingItemId] = useState<string | number | null>(null);

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) => 
            regex.test(part) ? (
                <mark key={i} className="bg-amber-200 dark:bg-amber-500/40 text-amber-900 dark:text-white rounded px-0.5">
                    {part}
                </mark>
            ) : part
        );
    };

    const [liveContent, setLiveContent] = useState<LiveDetails | null>(() => checkLiveContent(data.sections));

    useEffect(() => {
        const checkInterval = setInterval(() => {
            setLiveContent(checkLiveContent(data.sections));
        }, 60000); // Check every minute
        return () => clearInterval(checkInterval);
    }, [data.sections]);

    const handleSubjectSwipe = (direction: 'next' | 'prev') => {
        if (!subjects.length) return;
        const currentIndex = subjects.findIndex(s => s.id === subject.id);
        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % subjects.length;
        } else {
            nextIndex = (currentIndex - 1 + subjects.length) % subjects.length;
        }
        
        onSubjectChange(subjects[nextIndex].slug);
    };

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

    const handleItemClick = async (item: CourseContent) => {
        let activeLink = '';
        
        if (item.slug) {
            setLoadingItemId(item.id);
            try {
                const headers: Record<string, string> = {
                    'Accept': 'application/json',
                };
                if (apiAuthorization) {
                    headers['Authorization'] = apiAuthorization;
                }
                const response = await fetch(`https://api.karigoripathsala.com/api/content/${item.slug}`, {
                    headers
                });
                if (response.ok) {
                    const resJson = await response.json();
                    
                    // Parse link with extremely robust fallback property checks
                    let dynamicLink = '';
                    if (resJson) {
                        if (typeof resJson === 'string') {
                            dynamicLink = resJson;
                        } else if (resJson.data) {
                            const d = resJson.data;
                            if (typeof d === 'string') {
                                dynamicLink = d;
                            } else if (d.video && d.video.link) {
                                dynamicLink = d.video.link;
                            } else if (d.video && d.video.url) {
                                dynamicLink = d.video.url;
                            } else if (d.link) {
                                dynamicLink = d.link;
                            } else if (d.url) {
                                dynamicLink = d.url;
                            } else if (d.resource && d.resource.link) {
                                dynamicLink = d.resource.link;
                            } else if (d.resource && d.resource.resourceable && d.resource.resourceable.link) {
                                dynamicLink = d.resource.resourceable.link;
                            }
                        } else if (resJson.video) {
                            if (resJson.video.link) dynamicLink = resJson.video.link;
                            else if (resJson.video.url) dynamicLink = resJson.video.url;
                        } else if (resJson.link) {
                            dynamicLink = resJson.link;
                        } else if (resJson.url) {
                            dynamicLink = resJson.url;
                        } else if (resJson.resource) {
                            if (resJson.resource.link) dynamicLink = resJson.resource.link;
                            else if (resJson.resource.resourceable && resJson.resource.resourceable.link) {
                                dynamicLink = resJson.resource.resourceable.link;
                            }
                        }
                    }
                    if (dynamicLink) {
                        activeLink = dynamicLink;
                    }
                }
            } catch (error) {
                console.error('Failed to resolve dynamic course content URL for:', item.slug, error);
            } finally {
                setLoadingItemId(null);
            }
        }

        // Fall back to resolved static link if dynamic fetching yielded nothing
        if (!activeLink) {
            activeLink = resolveLink(item);
        }

        if (!activeLink) return;

        const title = item.title.toLowerCase();
        const url = activeLink.toLowerCase();
        
        let type: 'video' | 'pdf' | 'other' = 'other';
        if (item.type === 'video' || title.includes('video') || url.includes('youtube') || url.includes('youtu.be')) {
            type = 'video';
        } else if (item.type === 'pdf' || title.includes('pdf') || url.includes('.pdf')) {
            type = 'pdf';
        }

        if (type !== 'other') {
            setActiveMedia({ url: activeLink, type, title: item.title });
        } else {
            window.open(activeLink, '_blank');
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

    const bannerX = motionValue(0);
    const nextLabelOpacity = useTransform(bannerX, [0, -100], [0, 1]);
    const prevLabelOpacity = useTransform(bannerX, [0, 100], [0, 1]);
    const bannerRotate = useTransform(bannerX, [-200, 200], [-3, 3]);
    const bannerScale = useTransform(bannerX, [-200, 0, 200], [0.95, 1, 0.95]);

    return (
        <div className="flex-1 flex flex-col bg-bg transition-colors duration-300">
            <div className="relative p-4 lg:p-0 lg:mb-10">
                <motion.div 
                    drag="x"
                    style={{ x: bannerX, rotate: bannerRotate, scale: bannerScale }}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                        const threshold = 100;
                        if (info.offset.x > threshold) {
                            handleSubjectSwipe('prev');
                        } else if (info.offset.x < -threshold) {
                            handleSubjectSwipe('next');
                        }
                    }}
                    className="relative cursor-grab active:cursor-grabbing touch-none z-20"
                >
                    {/* Banner Swipe Indicators */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-10 z-30">
                        <motion.div 
                            style={{ opacity: prevLabelOpacity }}
                            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 -translate-x-12"
                        >
                            <ChevronRight size={20} className="rotate-180 text-indigo-600" />
                            <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">Previous Subject</span>
                        </motion.div>
                        <motion.div 
                            style={{ opacity: nextLabelOpacity }}
                            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 translate-x-12"
                        >
                            <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">Next Subject</span>
                            <ChevronRight size={20} text-indigo-600 />
                        </motion.div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch select-none">
                        <div className="lg:w-1/2 aspect-[16/9] lg:aspect-auto bg-slate-200 dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-lg relative group">
                            {liveContent && extractYouTubeVideoId(liveContent.link) ? (
                                <iframe 
                                    src={`https://www.youtube.com/embed/${extractYouTubeVideoId(liveContent.link)}?rel=0&modestbranding=1&controls=1&autoplay=0`}
                                    className="w-full h-full border-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : data.image?.link ? (
                                <img 
                                    src={data.image.link} 
                                    alt="Course Banner" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    loading="lazy"
                                />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
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
                            {liveContent && (
                                <div className="absolute bottom-4 left-4 bg-rose-600 px-3 py-1 rounded-full flex items-center gap-2 text-[10px] text-white font-black uppercase tracking-widest animate-pulse z-30">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                    LIVE CLASS: {liveContent.title}
                                </div>
                            )}
                        </div>

                        <div className="lg:w-1/2 flex flex-col justify-center px-4 lg:px-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 w-fit">
                                {data.subtitle || 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং'}
                            </div>
                            <h1 
                                onClick={(e) => { e.stopPropagation(); handleSecretClick(); }}
                                className="text-2xl md:text-3xl lg:text-5xl font-black text-slate-800 dark:text-white leading-tight mb-4 pointer-events-auto cursor-pointer active:scale-[0.98] transition-all"
                            >
                                {data.title}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base lg:text-lg max-w-xl">
                                আপনার শেখার যাত্রাকে আরও সহজ এবং আনন্দদায়ক করতে আমরা নিয়ে এসেছি সেরা সব রিসোর্স। নিয়মিত প্র্যাকটিস করুন এবং আপনার লক্ষ্য পূরণ করুন।
                            </p>
                            
                            <div className="mt-8 flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 123}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                                    <span className="text-indigo-600 dark:text-indigo-400">12k+</span> Students Learning
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
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

            <div className="px-4 py-2 space-y-6 lg:space-y-8 pb-24">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 items-start">
                        {filteredSections.map((section, idx) => {
                            const isExpanded = activeSectionId === (section.id || idx);
                            const completedInSection = section.contents.filter(c => completionMap[c.id]).length;
                            
                            return (
                                <motion.div 
                                    key={section.id || idx} 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-card-bg rounded-3xl shadow-sm border transition-all ${
                                        isExpanded 
                                        ? 'border-indigo-600/30 ring-4 ring-indigo-600/5' 
                                        : 'border-border'
                                    }`}
                                >
                                    <button 
                                        onClick={() => toggleSection(section.id || idx)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left group"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-90 shadow-lg shadow-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600'}`}>
                                                <ChevronRight size={20} />
                                            </div>
                                            <h3 className="font-bold text-[16px] text-slate-800 dark:text-slate-200 leading-snug group-hover:text-indigo-600 transition-colors break-words">
                                                {highlightText(section.title, searchTerm)}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4 ml-4">
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(completedInSection / section.contents.length) * 100}%` }}
                                                    className="h-full bg-indigo-600 rounded-full" 
                                                />
                                            </div>
                                            <span className="text-xs font-black text-slate-400 min-w-[30px] text-right">
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
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 pt-0 space-y-2 border-t border-slate-50 dark:border-slate-800/50 mt-2">
                                                    <div className="pt-4 space-y-2">
                                                        {section.contents.map((item, cIdx) => {
                                                            const isDone = completionMap[item.id];
                                                            const isFavorite = favoritesMap[item.id];
                                                            const link = resolveLink(item);
                                                            const isYouTube = item.type === 'video' || item.title.toLowerCase().includes('video') || link.toLowerCase().includes('youtube') || link.toLowerCase().includes('youtu.be');
                                                            const isPDF = item.type === 'pdf' || item.title.toLowerCase().includes('pdf') || link.toLowerCase().includes('.pdf');
                                                            
                                                            return (
                                                                <CourseItem 
                                                                    key={item.id || cIdx}
                                                                    item={item}
                                                                    cIdx={cIdx}
                                                                    isDone={isDone}
                                                                    isFavorite={isFavorite}
                                                                    isPDF={isPDF}
                                                                    isYouTube={isYouTube}
                                                                    link={link}
                                                                    searchTerm={searchTerm}
                                                                    isOffline={isOffline}
                                                                    isLocked={false}
                                                                    isLoading={loadingItemId === item.id}
                                                                    onToggleComplete={() => toggleComplete(item.id, { stopPropagation: () => {} } as any)}
                                                                    onToggleFavorite={() => toggleFavorite(item.id, { stopPropagation: () => {} } as any)}
                                                                    onClick={() => handleItemClick(item)}
                                                                    getIcon={getIcon}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
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
