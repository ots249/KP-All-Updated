import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, RotateCcw, Lock, BookOpen, RefreshCw, Smartphone } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import InstallPage from './pages/InstallPage';
import { AppStorage } from './lib/api';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => AppStorage.get<'light' | 'dark'>('theme') || 'light');
    const [isStandalone, setIsStandalone] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        AppStorage.set('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <div className="min-h-screen bg-bg text-text transition-colors duration-500">
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/app" element={<InstallPage />} />
                </Routes>
            </AnimatePresence>

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
