import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { API, AppStorage } from '../lib/api';
import { WebsiteConfig, Subject } from '../types';
import { Plus, Trash2, Edit2, Save, X, ExternalLink, Settings, LayoutGrid, CheckCircle, Info, AlertCircle, RefreshCw, Lock, ArrowLeft, ChevronRight, Home, ArrowUpDown, ChevronUp, ChevronDown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';

const Admin: React.FC = () => {
    const [config, setConfig] = useState<WebsiteConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingApi, setTestingApi] = useState(false);
    const [importing, setImporting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{
        status: 'synced' | 'out-of-sync' | 'error' | 'checking';
        firebaseCount: number;
        jsonbinCount: number;
        missingInFbCount: number;
        missingInJbCount: number;
        diffCount: number;
    }>({ 
        status: 'checking', 
        firebaseCount: 0, 
        jsonbinCount: 0,
        missingInFbCount: 0,
        missingInJbCount: 0,
        diffCount: 0
    });
    const [legacyBinId, setLegacyBinId] = useState('69f41baaaaba8821975a738f');
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const auth = AppStorage.get<boolean>('admin_auth');
        return auth === true;
    });
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const navigate = useNavigate();

    // Form states
    const [formData, setFormData] = useState({ name: '', slug: '', apiUrl: '' });
    const [discrepancies, setDiscrepancies] = useState<{ id: string, type: 'missing_in_fb' | 'missing_in_jb' | 'diff' }[]>([]);
    const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

    useEffect(() => {
        if (isAuthenticated) {
            loadConfig();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const handleImport = async () => {
        if (!legacyBinId) return setMessage({ text: 'Bin ID প্রদান করুন', type: 'error' });
        setImporting(true);
        try {
            const legacyData = await API.fetchLegacyConfig(legacyBinId);
            if (legacyData && legacyData.subjects) {
                const mergedSubjects = [...(config?.subjects || [])];
                
                // Add only new ones
                legacyData.subjects.forEach(s => {
                    if (!mergedSubjects.find(ms => ms.slug === s.slug)) {
                        mergedSubjects.push(s);
                    }
                });

                const updated = { subjects: mergedSubjects };
                await handleSave(updated);
                setMessage({ text: 'সফলভাবে ইম্পোর্ট করা হয়েছে', type: 'success' });
                setShowImportDialog(false);
            }
        } catch (err) {
            setMessage({ text: 'ইম্পোর্ট করা সম্ভব হয়নি। Bin ID চেক করুন।', type: 'error' });
        } finally {
            setImporting(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPass = password.trim();
        
        if (trimmedPass === '1234') {
            setLoggingIn(true);
            try {
                // Try Firebase Auth but don't block login if it fails
                try {
                    await signInAnonymously(auth);
                } catch (fbErr) {
                    console.warn("Firebase Auth blocked, proceeding in offline mode", fbErr);
                }
                
                AppStorage.set('admin_auth', true);
                setIsAuthenticated(true);
                setPassword('');
            } catch (err: any) {
                console.error("Critical login error:", err);
                setMessage({ text: 'লগইন করতে সমস্যা হয়েছে', type: 'error' });
            } finally {
                setLoggingIn(false);
            }
        } else {
            setMessage({ text: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।', type: 'error' });
            setTimeout(() => setMessage(null), 3000);
            setPassword('');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        AppStorage.set('admin_auth', false);
        navigate('/');
    };

    const loadConfig = async () => {
        try {
            const data = await API.fetchConfig();
            setConfig(data);
            checkSync(data);
        } catch (err) {
            setMessage({ text: 'কনফিগ লোড করতে ব্যর্থ', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const checkSync = async (fbConfig: WebsiteConfig) => {
        setSyncStatus(prev => ({ ...prev, status: 'checking' }));
        setDiscrepancies([]);
        try {
            const jbConfig = await API.fetchLegacyConfig(legacyBinId);
            const fbSubjects = fbConfig.subjects || [];
            const jbSubjects = jbConfig.subjects || [];
            
            const diffs: { id: string, type: 'missing_in_fb' | 'missing_in_jb' | 'diff' }[] = [];
            let missingInJbCount = 0;
            let missingInFbCount = 0;
            let diffCount = 0;
            
            // Check for missing/different in JB (What's in FB that's not in JB)
            fbSubjects.forEach(fb => {
                const jb = jbSubjects.find(j => j.id === fb.id || j.slug === fb.slug);
                if (!jb) {
                    diffs.push({ id: fb.id, type: 'missing_in_jb' });
                    missingInJbCount++;
                } else if (fb.apiUrl !== jb.apiUrl || fb.name !== jb.name || fb.slug !== jb.slug) {
                    diffs.push({ id: fb.id, type: 'diff' });
                    diffCount++;
                }
            });

            // Check for missing in FB (What's in JB that's not in FB)
            jbSubjects.forEach(jb => {
                if (!fbSubjects.find(fb => fb.id === jb.id || fb.slug === jb.slug)) {
                    diffs.push({ id: jb.id, type: 'missing_in_fb' });
                    missingInFbCount++;
                }
            });

            setDiscrepancies(diffs);
            setSyncStatus({
                status: diffs.length === 0 ? 'synced' : 'out-of-sync',
                firebaseCount: fbSubjects.length,
                jsonbinCount: jbSubjects.length,
                missingInFbCount,
                missingInJbCount,
                diffCount
            });
        } catch (e) {
            setSyncStatus(prev => ({ ...prev, status: 'error' }));
        }
    };

    const syncToLegacy = async () => {
        if (!config) return;
        setSyncing(true);
        try {
            await API.updateConfig(config); // This already syncs to both
            await checkSync(config);
            setMessage({ text: 'সব ডাটা সিঙ্ক করা হয়েছে', type: 'success' });
        } catch (err) {
            setMessage({ text: 'সিঙ্ক করতে ব্যর্থ', type: 'error' });
        } finally {
            setSyncing(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleSave = async (updatedConfig: WebsiteConfig) => {
        setSaving(true);
        try {
            const finalConfig = { ...updatedConfig, lastUpdated: new Date().toISOString() };
            await API.updateConfig(finalConfig);
            setConfig(finalConfig);
            checkSync(finalConfig);
            AppStorage.set('website_config', finalConfig);
            setMessage({ text: 'সফলভাবে সেভ করা হয়েছে!', type: 'success' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ text: 'সেভ করতে সমস্যা হয়েছে', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const testApi = async () => {
        if (!formData.apiUrl) return setMessage({ text: 'API URL প্রদান করুন', type: 'error' });
        setTestingApi(true);
        try {
            const data = await API.fetchCourseData(formData.apiUrl);
            if (data && data.sections) {
                setMessage({ text: `সফল! ${data.sections.length} টি সেকশন পাওয়া গেছে`, type: 'success' });
            } else {
                throw new Error('অবৈধ্য ডাটা ফরম্যাট');
            }
        } catch (err) {
            setMessage({ text: 'API থেকে ডাটা পাওয়া যায়নি', type: 'error' });
        } finally {
            setTestingApi(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const addSubject = async () => {
        if (!config || !formData.name || !formData.slug || !formData.apiUrl) return;
        
        const newSubject: Subject = {
            id: Date.now().toString(),
            ...formData
        };

        const updated = {
            ...config,
            subjects: [...config.subjects, newSubject]
        };
        
        await handleSave(updated);
        setShowAddModal(false);
        setFormData({ name: '', slug: '', apiUrl: '' });
    };

    const deleteSubject = (id: string) => {
        if (!config || !window.confirm('আপনি কি নিশ্চিত যে এটি ডিলিট করতে চান?')) return;
        
        const updated = {
            ...config,
            subjects: config.subjects.filter(s => s.id !== id)
        };
        handleSave(updated);
    };

    const updateSubject = () => {
        if (!config || !editingSubject) return;
        
        const updated = {
            ...config,
            subjects: config.subjects.map(s => s.id === editingSubject.id ? { ...s, ...formData } : s)
        };
        
        handleSave(updated);
        setEditingSubject(null);
        setFormData({ name: '', slug: '', apiUrl: '' });
    };

    const startEditing = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({ name: subject.name, slug: subject.slug, apiUrl: subject.apiUrl });
    };

    const moveSubject = async (index: number, direction: 'up' | 'down') => {
        if (!config) return;
        const newSubjects = [...config.subjects];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newSubjects.length) return;
        
        const temp = newSubjects[index];
        newSubjects[index] = newSubjects[targetIndex];
        newSubjects[targetIndex] = temp;
        
        await handleSave({ ...config, subjects: newSubjects });
    };

    const setDefaultSubject = async (id: string) => {
        if (!config) return;
        await handleSave({ ...config, defaultSubjectId: id });
    };

    const getSortedSubjects = () => {
        if (!config) return [];
        const subjects = [...config.subjects];
        if (sortOrder === 'asc') {
            return subjects.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOrder === 'desc') {
            return subjects.sort((a, b) => b.name.localeCompare(a.name));
        }
        return subjects;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold">লোডিং হচ্ছে...</p>
        </div>
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100"
                >
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-center mb-2">এ্যাডমিন প্যানেল</h1>
                    <p className="text-slate-500 text-center mb-8 text-sm">অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="পাসওয়ার্ড লিখুন"
                            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all text-center font-bold"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={loggingIn}
                            className="w-full p-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {loggingIn ? <RefreshCw className="animate-spin" /> : null}
                            {loggingIn ? 'প্রবেশ করা হচ্ছে...' : 'প্রবেশ করুন'}
                        </button>
                    </form>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full mt-4 p-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                        ফিরে যান
                    </button>
                </motion.div>
                {message && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-xl">
                        {message.text}
                    </div>
                )}
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50 pb-20"
        >
            <div className="max-w-3xl mx-auto px-6 pt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <nav className="flex items-center gap-2 text-sm font-bold mb-6">
                            <button 
                                onClick={() => navigate('/')} 
                                className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                <Home size={16} /> হোম
                            </button>
                            <ChevronRight size={14} className="text-slate-300" />
                            <span className="text-indigo-600">এ্যাডমিন ড্যাশবোর্ড</span>
                        </nav>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                            এ্যাডমিন ড্যাশবোর্ড
                        </h1>
                        <p className="text-slate-500 font-medium">সাবজেক্ট এবং কনফিগারেশন ম্যানেজমেন্ট</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-border shadow-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                    syncStatus.status === 'synced' ? 'bg-emerald-500 animate-pulse' : 
                                    syncStatus.status === 'out-of-sync' ? 'bg-amber-500' : 
                                    syncStatus.status === 'error' ? 'bg-rose-500' : 'bg-slate-300 animate-bounce'
                                }`} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {syncStatus.status === 'synced' ? 'Synced' : 
                                     syncStatus.status === 'out-of-sync' ? 'Out of Sync' : 
                                     syncStatus.status === 'error' ? 'Sync Error' : 'Checking...'}
                                </span>
                            </div>

                            <button 
                                onClick={syncToLegacy}
                                disabled={syncing}
                                className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                title="সব ডাটা রি-সিঙ্ক করুন"
                            >
                                <RefreshCw size={22} className={syncing ? 'animate-spin' : ''} />
                            </button>
                            <button 
                                onClick={() => {
                                    if (sortOrder === 'none') setSortOrder('asc');
                                    else if (sortOrder === 'asc') setSortOrder('desc');
                                    else setSortOrder('none');
                                }}
                                className={`p-4 rounded-2xl transition-all flex items-center gap-2 font-bold ${
                                    sortOrder !== 'none' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                                title="ক্রমানুসারে সাজান"
                            >
                                <ArrowUpDown size={22} />
                                {sortOrder !== 'none' && (
                                    <span className="text-[10px] font-black uppercase">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                                )}
                            </button>

                            <button 
                                onClick={handleLogout}
                                className="p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                title="লগআউট করুন"
                            >
                                <Lock size={22} />
                            </button>
                            <button 
                                onClick={() => setShowImportDialog(true)}
                                className="p-4 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all"
                                title="পুরাতন সাবজেক্ট ইম্পোর্ট করুন"
                            >
                                <RefreshCw size={22} />
                            </button>
                            <button 
                              onClick={() => setShowAddModal(true)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1"
                            >
                              <Plus size={22} /> নতুন সাবজেক্ট
                            </button>
                        </div>

                        {syncStatus.status !== 'synced' && syncStatus.status !== 'checking' && (
                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {syncStatus.missingInJbCount > 0 && (
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <AlertCircle size={10} /> {syncStatus.missingInJbCount} Missing in JSONBin
                                    </span>
                                )}
                                {syncStatus.missingInFbCount > 0 && (
                                    <span className="flex items-center gap-1 text-rose-600">
                                        <AlertCircle size={10} /> {syncStatus.missingInFbCount} Missing in Firebase
                                    </span>
                                )}
                                {syncStatus.diffCount > 0 && (
                                    <span className="flex items-center gap-1 text-blue-600">
                                        <Info size={10} /> {syncStatus.diffCount} Mismatched Content
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 p-5 rounded-2xl flex items-center gap-4 border-2 ${
                            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <span className="font-bold">{message.text}</span>
                    </motion.div>
                )}

                <div className="grid gap-6">
                    {getSortedSubjects().map((subject, index) => (
                        <div key={subject.id} className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group ${
                            config?.defaultSubjectId === subject.id ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-slate-100'
                        }`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl relative">
                                            {subject.name.charAt(0)}
                                            {discrepancies.find(d => d.id === subject.id) && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center" title="Sync issue detected">
                                                    <AlertCircle size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-slate-800">{subject.name}</h3>
                                                {config?.defaultSubjectId === subject.id && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        <Star size={10} fill="currentColor" /> ডিফল্ট
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full">{subject.slug}</span>
                                                {discrepancies.find(d => d.id === subject.id)?.type === 'missing_in_jb' && (
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Only in Firebase</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-2 bg-slate-50 p-2 rounded-lg truncate">
                                      <Info size={12} className="shrink-0" />
                                      {subject.apiUrl}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex flex-col border-r border-slate-100 pr-2 mr-2">
                                        <button 
                                            onClick={() => moveSubject(index, 'up')}
                                            disabled={index === 0}
                                            className="p-2 text-slate-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                                            title="উপরে নিন"
                                        >
                                            <ChevronUp size={20} />
                                        </button>
                                        <button 
                                            onClick={() => moveSubject(index, 'down')}
                                            disabled={index === config?.subjects.length! - 1}
                                            className="p-2 text-slate-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                                            title="নিচে নিন"
                                        >
                                            <ChevronDown size={20} />
                                        </button>
                                    </div>

                                    <button 
                                      onClick={() => setDefaultSubject(subject.id)}
                                      className={`p-4 rounded-2xl transition-all ${
                                        config?.defaultSubjectId === subject.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                        : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'
                                      }`}
                                      title={config?.defaultSubjectId === subject.id ? "ডিফল্ট সাবজেক্ট" : "ডিফল্ট হিসেবে সেট করুন"}
                                    >
                                      <Star size={20} fill={config?.defaultSubjectId === subject.id ? "currentColor" : "none"} />
                                    </button>

                                    <button 
                                      onClick={() => startEditing(subject)}
                                      className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                                      title="এডিট"
                                    >
                                      <Edit2 size={20} />
                                    </button>
                                    <button 
                                      onClick={() => deleteSubject(subject.id)}
                                      className="p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                      title="ডিলিট"
                                    >
                                      <Trash2 size={20} />
                                    </button>
                                    <a 
                                      href={`/?subject=${subject.slug}`} 
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-4 bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"
                                    >
                                      <ExternalLink size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            <AnimatePresence>
                {(showAddModal || editingSubject) && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowAddModal(false); setEditingSubject(null); }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div 
                            initial={{ y: -50, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.9 }}
                            className="fixed inset-x-4 top-20 md:max-w-md md:mx-auto bg-card-bg border border-border rounded-3xl z-[110] shadow-2xl p-8"
                        >
                            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                <span>এ্যাডমিন</span>
                                <ChevronRight size={10} />
                                <span className={editingSubject ? 'text-secondary' : 'text-primary'}>
                                    {editingSubject ? 'এডিট' : 'নতুন'}
                                </span>
                            </nav>
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                {editingSubject ? <Edit2 className="text-secondary" /> : <Plus className="text-primary" />}
                                {editingSubject ? 'সাবজেক্ট এডিট করুন' : 'নতুন সাবজেক্ট'}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-text">নাম</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="উদা: কম্পিউটার নেটওয়ার্কস"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-text">স্লাগ (Slug)</label>
                                    <input 
                                        type="text" 
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="উদা: computer-networks"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-text">API URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={formData.apiUrl}
                                            onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
                                            placeholder="JSON API এর লিংক"
                                            className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-text"
                                        />
                                        <button 
                                            onClick={testApi}
                                            disabled={testingApi}
                                            className="px-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold hover:bg-indigo-100 disabled:opacity-50"
                                        >
                                            {testingApi ? <RefreshCw className="animate-spin" size={20} /> : <ExternalLink size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <button 
                                        onClick={() => { setShowAddModal(false); setEditingSubject(null); }}
                                        className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 text-text font-bold rounded-2xl"
                                    > বাতিল </button>
                                    <button 
                                        onClick={editingSubject ? updateSubject : addSubject}
                                        disabled={saving}
                                        className="flex-[2] p-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" /> : <Save />}
                                        {editingSubject ? 'আপডেট করুন' : 'সেভ করুন'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
                
                {showImportDialog && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowImportDialog(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div 
                            initial={{ y: -50, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.9 }}
                            className="fixed inset-x-4 top-20 md:max-w-md md:mx-auto bg-card-bg border border-border rounded-3xl z-[110] shadow-2xl p-8"
                        >
                            <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                                <RefreshCw className="text-amber-500" /> ডাটা ইম্পোর্ট
                            </h2>
                            <p className="text-text-light text-sm mb-6">আপনার পুরাতন JsonBin ID দিয়ে সব সাবজেক্ট ইম্পোর্ট করুন।</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Bin ID</label>
                                    <input 
                                        type="text" 
                                        value={legacyBinId}
                                        onChange={e => setLegacyBinId(e.target.value)}
                                        placeholder="উদা: 6618beedfe54b232679c8699"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-text"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => setShowImportDialog(false)}
                                        className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 text-text font-bold rounded-2xl"
                                    > বাতিল </button>
                                    <button 
                                        onClick={handleImport}
                                        disabled={importing}
                                        className="flex-[2] p-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-200 dark:shadow-none flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {importing ? <RefreshCw className="animate-spin" /> : <Save />}
                                        ইম্পোর্ট করুন
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

            </AnimatePresence>
        </motion.div>
    );
};

export default Admin;
