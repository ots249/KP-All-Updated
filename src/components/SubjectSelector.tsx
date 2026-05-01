import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Subject } from '../types';
import { BookOpen, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useSearchParams } from 'react-router-dom';

interface Props {
  subjects: Subject[];
  activeId: string;
}

const SubjectSelector: React.FC<Props> = ({ subjects, activeId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [, setSearchParams] = useSearchParams();

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gray-800 dark:bg-slate-700 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
                <BookOpen size={24} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto bg-white dark:bg-gray-900 rounded-t-3xl z-[70] p-6 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <BookOpen className="text-primary" /> কোর্সসমূহ
                                </h2>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {subjects.map(s => {
                                    const isActive = s.id === activeId;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setSearchParams({ subject: s.slug });
                                                setIsOpen(false);
                                            }}
                                            className={`w-full p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${
                                                isActive 
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' 
                                                : 'border-border bg-slate-50 dark:bg-slate-800 text-text hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                                                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                }`}>
                                                    {s.name.charAt(0)}
                                                </div>
                                                <span className="font-black text-lg">{s.name}</span>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 group-hover:scale-110'
                                            }`}>
                                                <ChevronRight size={18} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default SubjectSelector;
