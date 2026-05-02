import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, Play, Pause, Volume2, VolumeX, Maximize2, FileText, Loader2, Youtube, RotateCcw } from 'lucide-react';
import ReactPlayer from 'react-player';

interface Props {
  url: string;
  type: 'video' | 'pdf' | 'other';
  onClose: () => void;
  title: string;
}

const MediaViewer: React.FC<Props> = ({ url, type, onClose, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const playerRef = React.useRef<any>(null);
  const controlsTimeoutRef = React.useRef<any>(null);

  // Initialize playing state after mount to avoid interruption errors on fast unmounts
  useEffect(() => {
    setPlaying(true);
    return () => setPlaying(false);
  }, []);

  // Hardware Back Button Support
  useEffect(() => {
    window.history.pushState({ isMediaViewerOpen: true }, '');
    const handlePopState = () => onClose();
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.isMediaViewerOpen) {
        window.history.back();
      }
    };
  }, [onClose]);

  // Handle Controls Visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const togglePlay = () => setPlaying(!playing);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
    setMuted(false);
  };
  const toggleMute = () => setMuted(!muted);
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };
  const handleSeekMouseDown = () => setSeeking(true);
  const handleSeekMouseUp = (e: any) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };
  const handleProgress = (state: { played: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      // Fallback for duration if onDuration doesn't fire correctly in some environments
      if (duration === 0 && playerRef.current) {
        const d = playerRef.current.getDuration();
        if (d) setDuration(d);
      }
    }
  };
  const handleDuration = (dur: number) => setDuration(dur);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const Player = (ReactPlayer as any).default || ReactPlayer;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 font-sans">
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
              : 'bg-white border-b border-slate-200'
          } px-4 py-3 md:px-8 md:py-4 flex items-center justify-between z-20 shrink-0`}>
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              {type === 'video' ? (
                <div className="text-[#FF0000] shrink-0">
                  <Youtube size={28} className="fill-current" />
                </div>
              ) : (
                <div className="text-[#ef4444] shrink-0">
                  <FileText size={28} />
                </div>
              )}
              <h3 className={`font-bold text-[15px] md:text-lg truncate ${
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
                    className="bg-[#FF0000] hover:bg-[#cc0000] text-white px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-red-600/20"
                  >
                    <Youtube size={16} />
                    <span className="hidden sm:inline">ইউটিউবে দেখুন</span>
                  </a>
               ) : type === 'pdf' ? (
                  <button 
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = title || 'document.pdf';
                      a.click();
                    }}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/30"
                  >
                    <Download size={16} />
                    <span>ডাউনলোড</span>
                  </button>
               ) : null}
              
              <button 
                onClick={onClose}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:rotate-90 shadow-sm ${
                  type === 'video' 
                    ? 'bg-white/5 hover:bg-white/15 text-white border border-white/10' 
                    : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200'
                }`}
                title="বন্ধ করুন (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden bg-black/20">
            {/* Loading Indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[5] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                >
                  <div className="relative">
                    <Loader2 size={48} className="text-white animate-spin opacity-20" />
                    <Loader2 size={48} className="text-indigo-500 animate-spin absolute top-0 left-0 [animation-duration:1.5s]" />
                  </div>
                  <motion.p 
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-4 text-white/70 text-sm font-bold tracking-widest uppercase"
                  >
                    লোডিং হচ্ছে...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {type === 'video' ? (
              <div 
                className="w-full h-full relative group bg-black"
                onMouseMove={handleMouseMove}
                onClick={togglePlay}
              >
                <Player
                  ref={playerRef}
                  url={url}
                  width="100%"
                  height="100%"
                  playing={playing}
                  volume={volume}
                  muted={muted}
                  onProgress={handleProgress}
                  onReady={() => {
                    setIsReady(true);
                    setIsLoading(false);
                    // Explicitly set duration on ready
                    if (playerRef.current) {
                      const d = playerRef.current.getDuration();
                      if (d) setDuration(d);
                    }
                  }}
                  onStart={() => {
                    setIsLoading(false);
                  }}
                  onError={(e: any) => {
                    console.error('Player Error:', e);
                    setIsLoading(false);
                    setIsReady(true); 
                  }}
                  config={{
                    youtube: {
                      playerVars: { 
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        controls: 0,
                        disablekb: 1
                      }
                    }
                  }}
                />

                {/* Custom Controls UI */}
                <AnimatePresence>
                  {showControls && isReady && (
                    <motion.div 
                      key="controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-30"
                    >
                      {/* Seek Bar */}
                      <div className="group/seek mb-4 relative h-1.5 md:h-2">
                        <input
                          type="range"
                          min={0}
                          max={0.999999}
                          step="any"
                          value={played}
                          onMouseDown={handleSeekMouseDown}
                          onChange={handleSeekChange}
                          onMouseUp={handleSeekMouseUp}
                          className="absolute inset-0 w-full opacity-0 z-20 cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-indigo-500"
                            style={{ width: `${played * 100}%` }}
                          />
                        </div>
                        <motion.div 
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg z-10 pointer-events-none opacity-0 group-hover/seek:opacity-100 transition-opacity"
                          style={{ left: `${played * 100}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 md:gap-6">
                          <button 
                            onClick={togglePlay}
                            className="text-white hover:text-indigo-400 transition-colors"
                          >
                            {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                          </button>

                          <div className="hidden sm:flex items-center gap-3 group/volume">
                            <button 
                              onClick={toggleMute}
                              className="text-white hover:text-indigo-400 transition-colors"
                            >
                              {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={24} />}
                            </button>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step="any"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-0 group-hover/volume:w-20 transition-all overflow-hidden cursor-pointer h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                          </div>

                          <div className="text-white/90 text-xs md:text-sm font-bold font-mono">
                            {formatTime(played * duration)} <span className="text-white/40">/</span> {formatTime(duration)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <button 
                            onClick={() => playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10)}
                            className="text-white/70 hover:text-white transition-colors"
                            title="10s Back"
                          >
                            <RotateCcw size={20} />
                          </button>
                          
                          <button 
                             onClick={() => {
                               const container = playerRef.current?.getInternalPlayer()?.parentElement?.parentElement;
                               if (container?.requestFullscreen) {
                                 container.requestFullscreen();
                               } else if ((container as any)?.webkitRequestFullscreen) {
                                 (container as any).webkitRequestFullscreen();
                               }
                             }}
                             className="text-white/70 hover:text-white transition-colors"
                             title="Full Screen"
                          >
                            <Maximize2 size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : type === 'pdf' ? (
              <div className="w-full h-full bg-[#e2e8f0]">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                  className="w-full h-full"
                  frameBorder="0"
                  onLoad={() => {
                    setIsLoading(false);
                    setIsReady(true);
                  }}
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
