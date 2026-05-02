import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Star, CheckCircle2, Search, Smartphone, Lightbulb, X } from 'lucide-react';
import { AppStorage } from '../lib/api';

const steps = [
    {
        id: 'welcome',
        title: 'Master Class এ স্বাগতম!',
        description: 'আপনার পড়াশোনাকে আরও সহজ করতে আমরা নিয়ে এসেছি আধুনিক সব ফিচার। চলুন এক নজরে দেখে নেই!',
        icon: <Smartphone className="text-indigo-600" size={48} />,
        animation: {
            y: [0, -10, 0],
            transition: { duration: 2, repeat: Infinity }
        }
    },
    {
        id: 'banner_swipe',
        title: 'সাবজেক্ট পরিবর্তন করুন',
        description: 'কোর্সের উপরের ব্যানারটি বামে বা ডানে সোয়াইপ করে সহজেই এক বিষয় থেকে অন্য বিষয়ে যেতে পারবেন।',
        icon: (
            <div className="relative w-32 h-16 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                <motion.div 
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex gap-2"
                >
                    <ChevronLeft size={20} className="text-indigo-600 opacity-30" />
                    <div className="w-12 h-8 bg-indigo-500/20 rounded-md" />
                    <ChevronRight size={20} className="text-indigo-600 opacity-30" />
                </motion.div>
            </div>
        )
    },
    {
        id: 'item_swipe',
        title: 'সোয়াইপ অ্যাকশন',
        description: 'যেকোনো লেকচার আইটেমে ডানদিকে সোয়াইপ করে ফেভারিট এবং বামদিকে সোয়াইপ করে সম্পন্ন (Complete) হিসেবে মার্ক করুন।',
        icon: (
            <div className="flex gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-500">
                    <Star size={24} fill="currentColor" />
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600">
                    <CheckCircle2 size={24} />
                </div>
            </div>
        )
    },
    {
        id: 'features',
        title: 'সার্চ ও ডার্ক মোড',
        description: 'খুব দ্রুত কিছু খুঁজে পেতে সার্চ অপশন এবং চোখের আরামের জন্য ডার্ক মোড ব্যবহার করুন।',
        icon: (
            <div className="flex gap-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600">
                    <Search size={24} />
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600">
                    <Lightbulb size={24} />
                </div>
            </div>
        )
    }
];

const TutorialOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            AppStorage.set('tutorial_completed', true);
            onClose();
        }
    };

    const handleSkip = () => {
        AppStorage.set('tutorial_completed', true);
        onClose();
    };

    const step = steps[currentStep];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
        >
            <motion.div 
                layout
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
                <button 
                    onClick={handleSkip}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2"
                >
                    <X size={20} />
                </button>

                <div className="p-8 pt-12 flex flex-col items-center text-center">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={step.id}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="mb-8"
                        >
                            {step.icon}
                        </motion.div>
                    </AnimatePresence>

                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                        {step.title}
                    </h2>
                    
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                        {step.description}
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button 
                            onClick={handleNext}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
                        >
                            {currentStep === steps.length - 1 ? 'শুরু করুন' : 'পরবর্তী'}
                        </button>
                        
                        <div className="flex justify-center gap-1.5 mt-4">
                            {steps.map((_, i) => (
                                <div 
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TutorialOverlay;
