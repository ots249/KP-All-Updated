import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { API, AppStorage } from '../lib/api';
import { WebsiteConfig, Subject, CourseData, CourseSection, CourseContent } from '../types';
import { ChevronRight, CheckCircle2, Circle, FileText, Youtube, Video, MessageCircle, Clock, AlertCircle, RefreshCw, Settings, WifiOff, Cloud } from 'lucide-react';
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

    return (
        <div className="shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-[10px] font-black text-text-light tracking-tighter">
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

const CourseView: React.FC<Props> = ({ data, subject, syncing, onRetry, error, isOffline }) => {
    const [activeSectionId, setActiveSectionId] = useState<string | number | null>(data.sections[0]?.id || 2026);
    const [completionMap, setCompletionMap] = useState<Record<string, boolean>>(() => 
        AppStorage.get<Record<string, boolean>>(`completedItems_${subject.apiUrl}`) || {}
    );
    const [activeMedia, setActiveMedia] = useState<{ url: string, type: 'video' | 'pdf' | 'other', title: string } | null>(null);

    useEffect(() => {
        AppStorage.set(`completedItems_${subject.apiUrl}`, completionMap);
    }, [completionMap, subject.apiUrl]);

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
                {data.sections.map((section, idx) => {
                    const isExpanded = activeSectionId === (section.id || idx);
                    const completedInSection = section.contents.filter(c => completionMap[c.id]).length;
                    
                    return (
                        <div key={section.id || idx} className="bg-card-bg rounded-3xl shadow-sm border border-border overflow-hidden transition-all">
                            <button 
                                onClick={() => toggleSection(section.id || idx)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <ChevronRight 
                                        size={20} 
                                        className={`text-indigo-600 transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`} 
                                    />
                                    <h3 className="font-bold text-[16px] text-text leading-tight">
                                        {section.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden xs:block">
                                        <div 
                                            className="h-full bg-indigo-200 dark:bg-indigo-900 rounded-full" 
                                            style={{ width: `${(completedInSection / section.contents.length) * 100}%` }}
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
                                                    <div 
                                                        key={item.id || cIdx}
                                                        onClick={() => handleItemClick(item)}
                                                        className={`p-4 rounded-2xl border border-border transition-all flex items-center gap-4 cursor-pointer shadow-sm ${
                                                            isDone 
                                                            ? 'bg-slate-50/50 dark:bg-slate-900/50 opacity-60' 
                                                            : 'bg-card-bg hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 active:scale-[0.98]'
                                                        }`}
                                                    >
                                                        <div 
                                                            onClick={(e) => toggleComplete(item.id, e)}
                                                            className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                                isDone ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700'
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
                                                                <div className="flex items-center gap-1 mt-0.5 text-[#10b981] text-[9px] font-black uppercase tracking-tighter">
                                                                    <Cloud size={10} fill="currentColor" className="opacity-50" />
                                                                    <span>Offline Available</span>
                                                                </div>
                                                            )}
                                                        </div>
 
                                                        {isYouTube && (
                                                            <VideoDuration url={link} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
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
