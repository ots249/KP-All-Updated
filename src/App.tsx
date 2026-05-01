import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, RotateCcw, Lock, BookOpen, RefreshCw } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { AppStorage } from './lib/api';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => AppStorage.get<'light' | 'dark'>('theme') || 'light');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
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
                <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </AnimatePresence>

            {location.pathname !== '/admin' && (
                <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 active:scale-90 transition-all flex items-center justify-center hover:rotate-180 duration-500"
                  >
                    <RefreshCw size={24} />
                  </button>
                </div>
            )}
        </div>
    );
};

export default App;
