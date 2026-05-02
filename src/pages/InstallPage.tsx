import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Chrome, Info, ChevronRight, Share, PlusSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">অ্যাপ ইন্সটল করুন</h1>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* App Info Hero */}
        <div className="text-center space-y-4 py-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 mx-auto bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white"
          >
            <Download size={40} />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">কারিগরি পাঠশালা App</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">সহজে এবং দ্রুত শিখুন মোবাইল অ্যাপের মাধ্যমে</p>
          </div>
        </div>

        {isStandalone ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-6 rounded-3xl text-center"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
              <Smartphone size={24} />
            </div>
            <h3 className="text-emerald-900 dark:text-emerald-400 font-bold text-lg">আপনার অ্যাপটি ইতিমধ্যে ইন্সটল করা আছে!</h3>
            <p className="text-emerald-700 dark:text-emerald-500 text-sm mt-2">আপনি অ্যাপ মোড ব্যবহার করছেন।</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Install Button for Android/Chrome */}
            <AnimatePresence>
              {deferredPrompt && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  onClick={handleInstallClick}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-3xl font-bold flex items-center justify-between shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Chrome size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm opacity-80">অ্যান্ড্রয়েড ইউজারদের জন্য</div>
                      <div className="text-lg">অ্যাপ ইন্সটল করুন</div>
                    </div>
                  </div>
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* iOS Guide */}
            {isIOS && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-[2.5rem] shadow-sm space-y-6"
              >
                <div className="flex items-center gap-4 text-indigo-600">
                  <Smartphone size={24} />
                  <h3 className="text-lg font-bold">iPhone / iPad এ যেভাবে করবেন</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">১</div>
                    <div className="space-y-1">
                      <p className="text-slate-700 dark:text-slate-300">সাফারি ব্রাউজারে নিচের <Share className="inline-block mx-1 w-5 h-5 text-blue-500" /> আইকনে ক্লিক করুন</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">২</div>
                    <div className="space-y-1">
                      <p className="text-slate-700 dark:text-slate-300">মেনু থেকে একটু নিচে স্ক্রল করে <PlusSquare className="inline-block mx-1 w-5 h-5 text-slate-700 dark:text-slate-300" /> <span className="font-bold">Add to Home Screen</span> অপশনটি বেছে নিন</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">৩</div>
                    <div className="space-y-1">
                      <p className="text-slate-700 dark:text-slate-300">উপরে ডান পাশে <span className="font-bold">Add</span> বাটনে ক্লিক করলেই অ্যাপটি হোম স্ক্রিনে চলে যাবে</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Manual Guide for general browsers */}
            {!deferredPrompt && !isIOS && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-[2.5rem] shadow-sm space-y-6"
              >
                <div className="flex items-center gap-4 text-indigo-600">
                  <Info size={24} />
                  <h3 className="text-lg font-bold">ম্যানুয়ালি যেভাবে ইন্সটল করবেন</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">যদি ইন্সটল বাটন দেখতে না পান:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                      <span>ব্রাউজারের <span className="font-bold">তিনটি ডট (⋮)</span> মেনুতে ক্লিক করুন</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                      <span><span className="font-bold">Install App</span> অথবা <span className="font-bold">Add to Home screen</span> এ ক্লিক করুন</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <div className="text-indigo-500 font-bold">অফলাইন সুবিধা</div>
            <p className="text-xs text-slate-500">ইন্টারনেট ছাড়াও অ্যাপের ভেতরে ক্লাস নোট পড়তে পারবেন</p>
          </div>
          <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <div className="text-rose-500 font-bold">নোটিফিকেশন</div>
            <p className="text-xs text-slate-500">নতুন ক্লাস আপলোড হলে সাথে সাথে নোটিফিকেশন পাবেন</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstallPage;
