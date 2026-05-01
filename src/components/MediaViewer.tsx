import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, Play, Maximize2, FileText } from 'lucide-react';
import ReactPlayer from 'react-player';

interface Props {
  url: string;
  type: 'video' | 'pdf' | 'other';
  onClose: () => void;
  title: string;
}

const MediaViewer: React.FC<Props> = ({ url, type, onClose, title }) => {
  // Fix for ReactPlayer in some ESM environments
  const Player = (ReactPlayer as any).default || ReactPlayer;

  // Helper to get YouTube embed URL if it's a YouTube link
  const getYouTubeEmbedUrl = (videoUrl: string) => {
    try {
      let videoId = '';
      if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (videoUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(videoUrl);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (videoUrl.includes('youtube.com/embed/')) {
        videoId = videoUrl.split('embed/')[1].split(/[?#]/)[0];
      } else if (videoUrl.includes('youtube.com/shorts/')) {
        videoId = videoUrl.split('shorts/')[1].split(/[?#]/)[0];
      }
      
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
    } catch (e) {
      console.error('Error parsing YouTube URL:', e);
      return null;
    }
  };

  const youtubeEmbedUrl = type === 'video' ? getYouTubeEmbedUrl(url) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          className={`relative w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] ${
            type === 'video' ? 'aspect-video bg-black' : 'aspect-[4/5] md:aspect-auto md:h-[90vh] bg-[#f1f5f9]'
          } md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col z-10`}
        >
          {/* Header/Toolbar */}
          <div className={`${
            type === 'video' 
              ? 'bg-[#1f1f1f] border-b border-[#333]' 
              : 'bg-white border-b border-slate-200 shadow-sm'
          } px-4 py-3 md:px-8 md:py-4 flex items-center justify-between z-20 shrink-0`}>
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              {type === 'video' ? (
                <div className="text-[#FF0000] shrink-0">
                  <Play size={24} className="fill-current" />
                </div>
              ) : (
                <div className="text-rose-500 shrink-0">
                  <FileText size={24} />
                </div>
              )}
              <h3 className={`font-bold text-sm md:text-lg truncate max-w-xs md:max-w-md ${
                type === 'video' ? 'text-white' : 'text-slate-800'
              }`}>
                {title}
              </h3>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0 font-sans">
               {type === 'video' ? (
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-[#FF0000] hover:bg-[#cc0000] text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <ExternalLink size={16} />
                    <span className="hidden sm:inline">ইউটিউবে দেখুন</span>
                  </a>
               ) : type === 'pdf' ? (
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">ডাউনলোড</span>
                  </a>
               ) : null}
              
              <button 
                onClick={onClose}
                className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all hover:rotate-90 ${
                  type === 'video' 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden">
            {type === 'video' ? (
              <div className="w-full h-full relative group">
                {youtubeEmbedUrl ? (
                  <iframe
                    src={youtubeEmbedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                  />
                ) : (
                  <Player
                    url={url}
                    width="100%"
                    height="100%"
                    controls
                    playing
                    pip
                    className="react-player"
                  />
                )}
              </div>
            ) : type === 'pdf' ? (
              <div className="w-full h-full bg-[#e2e8f0]">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                  className="w-full h-full"
                  frameBorder="0"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white space-y-8 p-12 text-center">
                 <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                    <Maximize2 size={48} className="text-indigo-400" />
                 </div>
                 <div className="space-y-4">
                   <h2 className="text-3xl font-black">সরাসরি দেখা সম্ভব নয়</h2>
                   <p className="text-slate-400 text-lg">এই ফাইল ফরম্যাটটি ইন-অ্যাপ ভিউয়ারে সাপোর্ট করে না।</p>
                 </div>
                 <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl flex items-center gap-3 shadow-2xl shadow-indigo-500/50 transition-all hover:-translate-y-1"
                >
                  <Download size={24} /> ডাউনলোড করুন
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MediaViewer;
