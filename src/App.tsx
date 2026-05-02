import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, RefreshCw, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import SplashScreen from './components/SplashScreen';
import TutorialOverlay from './components/TutorialOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import { AppStorage } from './lib/api';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Admin = lazy(() => import('./pages/Admin'));
const InstallPage = lazy(() => import('./pages/InstallPage'));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-indigo-600"
        >
            <RefreshCw size={40} />
        </motion.div>
    </div>
);

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = AppStorage.get<'light' | 'dark'>('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            const tutorialCompleted = AppStorage.get<boolean>('tutorial_completed');
            if (!tutorialCompleted) {
                setShowTutorial(true);
            }
        }, 2800);
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const saved = AppStorage.get('theme');
            if (!saved) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        AppStorage.set('theme', theme);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            clearTimeout(timer);
        };
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <div className="min-h-screen bg-bg text-text transition-colors duration-500">
            <Helmet>
                <title>Master Class | Education Reinvented</title>
                <meta name="description" content="ডিপ্লোমা ইন ইঞ্জিনিয়ারিং শিক্ষার্থীদের পড়াশোনাকে আরও সহজ এবং আনন্দদায়ক করার জন্য তৈরি একটি আধুনিক লার্নিং প্ল্যাটফর্ম।" />
                <meta property="og:title" content="Master Class | Diploma Education Platform" />
                <meta property="og:description" content="Learn anywhere, anytime with interactive lectures and offline support." />
                <meta property="og:type" content="website" />
                <meta name="theme-color" content={theme === 'dark' ? '#0f172a' : '#ffffff'} />
            </Helmet>

            <AnimatePresence>
                {isLoading && <SplashScreen key="splash" />}
            </AnimatePresence>

            <AnimatePresence>
                {showTutorial && <TutorialOverlay key="tutorial" onClose={() => setShowTutorial(false)} />}
            </AnimatePresence>

            <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<Home />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/app" element={<InstallPage />} />
                        </Routes>
                    </AnimatePresence>
                </Suspense>
            </ErrorBoundary>

            {location.pathname !== '/admin' && location.pathname !== '/app' && (
                <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.location.reload()}
                    className="w-14 h-14 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-all"
                    title="রিফ্রেশ করুন"
                  >
                    <RefreshCw size={24} />
                  </motion.button>

                  <button 
                    onClick={toggleTheme}
                    className={`w-14 h-14 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center group ${
                      theme === 'light' 
                      ? 'bg-white text-indigo-600' 
                      : 'bg-slate-800 text-amber-400'
                    }`}
                    title={theme === 'light' ? 'ডার্ক মোড অন করুন' : 'লাইট মোড অন করুন'}
                  >
                    {theme === 'light' ? (
                      <Moon size={24} className="group-hover:-rotate-12 transition-transform" />
                    ) : (
                      <Sun size={24} className="group-hover:rotate-12 transition-transform" />
                    )}
                  </button>
                </div>
            )}
        </div>
    );
};

export default App;
