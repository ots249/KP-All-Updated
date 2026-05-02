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
            <header className="fixed top-6 right-6 z-50">
                <button 
                  onClick={toggleTheme}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2 ${
                    theme === 'light' 
                    ? 'bg-white border-slate-100 text-indigo-600' 
                    : 'bg-slate-800 border-slate-700 text-amber-400'
                  }`}
                >
                  {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </header>

            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/app" element={<InstallPage />} />
                </Routes>
            </AnimatePresence>

            {location.pathname !== '/admin' && location.pathname !== '/app' && (
                <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-14 h-14 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center hover:rotate-90 duration-500"
                    title="Refresh"
                  >
                    <RefreshCw size={24} />
                  </button>

                  {!isStandalone && (
                    <button 
                      onClick={() => navigate('/app')}
                      className="h-14 px-6 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 active:scale-90 transition-all flex items-center gap-3 font-bold border-2 border-indigo-400/20"
                    >
                      <Smartphone size={20} />
                      <span className="hidden sm:inline">Install App</span>
                    </button>
                  )}
                </div>
            )}
        </div>
    );
};

export default App;
