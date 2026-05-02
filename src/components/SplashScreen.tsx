import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles } from 'lucide-react';

const SplashScreen: React.FC = () => {
    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Animated Background Graphics */}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.15 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 blur-3xl pointer-events-none"
            />
            
            <motion.div 
                initial={{ x: -100, y: 100, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 0.1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl pointer-events-none"
            />

            {/* Logo & Content */}
            <div className="relative flex flex-col items-center gap-8">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 3 }}
                    transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2
                    }}
                    className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-indigo-600 shadow-2xl shadow-indigo-500/40 relative"
                >
                    <BookOpen size={48} />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 15, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-4 -right-4 text-amber-400"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                </motion.div>

                <div className="text-center space-y-2">
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-4xl font-black text-white tracking-tight"
                    >
                        Master <span className="text-indigo-400">Class</span>
                    </motion.h1>
                    <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 1, ease: "circOut" }}
                        className="h-1 w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto rounded-full"
                    />
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ delay: 1.2 }}
                        className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]"
                    >
                        Learn Anywhere • Anytime
                    </motion.p>
                </div>

                {/* Loading Bar Container */}
                <div className="mt-12 w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                    />
                </div>
            </div>

            {/* Bottom Credit */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-10 text-[10px] text-white font-bold uppercase tracking-widest"
            >
                Education Reinvented
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;
