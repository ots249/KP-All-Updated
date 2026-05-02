import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Trash2, 
    Edit2, 
    ExternalLink, 
    Save, 
    RefreshCw, 
    Lock, 
    ChevronRight, 
    ChevronUp, 
    ChevronDown, 
    Book, 
    Settings,
    LogOut,
    AlertCircle,
    Copy,
    LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppStorage } from '../lib/api';
import { Subject } from '../types';
import { useConfig, useUpdateConfig } from '../hooks/useCourseQueries';

const Admin: React.FC = () => {
    const navigate = useNavigate();
    const { data: config, isLoading } = useConfig();
    const updateConfig = useUpdateConfig();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    // Edit states
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', apiUrl: '' });
    const [testingApi, setTestingApi] = useState(false);
    const [saving, setSaving] = useState(false);

    // Legacy Import
    const [legacyBinId, setLegacyBinId] = useState('');
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        const auth = AppStorage.getAdminAuth();
        if (auth) setIsAuthenticated(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        // In a real app, this would be a Firebase Auth call or a secure backend check.
        // For this demo, we use the requested '1234' with a simulated delay.
        setTimeout(() => {
            if (password === '1234') {
                AppStorage.setAdminAuth(true);
                setIsAuthenticated(true);
                setMessage(null);
            } else {
                setMessage({ text: 'Access Denied: Invalid Authentication Key', type: 'error' });
            }
            setLoggingIn(false);
        }, 800);
    };

    const addSubject = async () => {
        if (!formData.name || !formData.slug || !formData.apiUrl) {
            alert('Please complete all sequence fields.');
            return;
        }

        setSaving(true);
        const newSubject: Subject = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData
        };

        const updatedSubjects = [...(config?.subjects || []), newSubject];
        try {
            await updateConfig.mutateAsync({ 
                ...config!, 
                subjects: updatedSubjects,
                lastUpdated: new Date().toISOString()
            });
            setShowAddModal(false);
            setFormData({ name: '', slug: '', apiUrl: '' });
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const deleteSubject = async (id: string) => {
        if (!window.confirm('Permanent Deletion: Are you sure you want to remove this record?')) return;
        if (!config) return;
        const updatedSubjects = config.subjects.filter(s => s.id !== id);
        await updateConfig.mutateAsync({ 
            ...config, 
            subjects: updatedSubjects,
            lastUpdated: new Date().toISOString()
        });
    };

    const startEditing = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({ name: subject.name, slug: subject.slug, apiUrl: subject.apiUrl });
    };

    const updateSubject = async () => {
        if (!editingSubject || !config) return;
        setSaving(true);
        const updatedSubjects = config.subjects.map(s => 
            s.id === editingSubject.id ? { ...s, ...formData } : s
        );
        
        await updateConfig.mutateAsync({ 
            ...config, 
            subjects: updatedSubjects,
            lastUpdated: new Date().toISOString()
        });
        setEditingSubject(null);
        setFormData({ name: '', slug: '', apiUrl: '' });
        setSaving(false);
    };

    const moveSubject = async (index: number, direction: 'up' | 'down') => {
        if (!config) return;
        const subjects = [...config.subjects];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= subjects.length) return;

        [subjects[index], subjects[newIndex]] = [subjects[newIndex], subjects[index]];
        await updateConfig.mutateAsync({ 
            ...config, 
            subjects,
            lastUpdated: new Date().toISOString()
        });
    };

    const setDefaultSubject = async (id: string) => {
        if (!config) return;
        await updateConfig.mutateAsync({ 
            ...config, 
            defaultSubjectId: id,
            lastUpdated: new Date().toISOString()
        });
    };

    const handleImport = async () => {
        if (!legacyBinId) return;
        setImporting(true);
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${legacyBinId}/latest`);
            const data = await response.json();
            if (data.record && data.record.subjects) {
                await updateConfig.mutateAsync({ 
                    ...(config || { subjects: [] }),
                    subjects: data.record.subjects,
                    lastUpdated: new Date().toISOString()
                });
                setShowImportDialog(false);
                setLegacyBinId('');
                alert('Migration Successful: Data synchronized.');
            }
        } catch (error) {
            alert('Migration Failed: Link validation failed.');
        } finally {
            setImporting(false);
        }
    };

    const testApi = async () => {
        if (!formData.apiUrl) return;
        setTestingApi(true);
        try {
            const res = await fetch(formData.apiUrl);
            if (res.ok) alert('Link Validation: Success');
            else alert('Link Validation: Failed');
        } catch (e) {
            alert('Link Validation: Network Error');
        } finally {
            setTestingApi(false);
        }
    };

    const getSortedSubjects = () => {
        return config?.subjects || [];
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin text-indigo-600" size={40} />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Synchronizing System...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-indigo-500/20 rotate-3">
                        <Lock size={32} />
                    </div>
                    
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Master Admin</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Secure access to control panel</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest px-2">Access Key</p>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••"
                                className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all text-center font-bold tracking-widest text-xl dark:text-white"
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loggingIn}
                            className="w-full p-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {loggingIn ? <RefreshCw className="animate-spin" size={20} /> : 'Login System'}
                        </button>
                    </form>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full mt-6 p-4 text-slate-400 dark:text-slate-600 font-bold hover:text-indigo-600 transition-colors text-sm"
                    >
                        Back to Home
                    </button>
                </motion.div>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3"
                    >
                        <AlertCircle size={20} />
                        {message.text}
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
            {/* Branding Sidebar - Desktop Only */}
            <aside className="hidden lg:flex w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col sticky top-0 h-screen overflow-y-auto">
                <div className="p-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white mb-2 leading-tight">
                        Admin<br />Control Panel
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                        Manage your educational resource ecosystem.
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600/60 font-mono">Main Operations</div>
                    <button className="w-full flex items-center gap-3 px-4 py-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Settings size={18} />
                        </div>
                        Subjects Management
                    </button>
                    <button 
                        onClick={() => setShowImportDialog(true)}
                        className="w-full flex items-center gap-3 px-4 py-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <RefreshCw size={18} />
                        </div>
                        Legacy Import
                    </button>
                    <button 
                        onClick={() => {
                            AppStorage.setAdminAuth(false);
                            window.location.reload();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                            <LogOut size={18} />
                        </div>
                        Secure Logout
                    </button>
                </nav>

                <div className="p-8 border-t border-slate-50 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">System Online</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Cloud Infrastructure active. Real-time synchronization enabled.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-12 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                            <span>Admin</span>
                            <ChevronRight size={10} />
                            <span>Dashboard</span>
                        </nav>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Active Subjects</h2>
                    </div>
                    
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="h-16 px-8 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 self-start"
                    >
                        <Plus size={24} />
                        <span>Add New Entry</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {getSortedSubjects().map((subject, index) => (
                            <motion.div
                                key={subject.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`group p-8 rounded-[2.5rem] border transition-all ${
                                    config?.defaultSubjectId === subject.id 
                                    ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-500/30 shadow-2xl shadow-indigo-500/5' 
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <Book size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">{subject.name}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subject.slug}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => moveSubject(index, 'up')}
                                            disabled={index === 0}
                                            className="p-2 text-slate-300 dark:text-slate-700 hover:text-indigo-600 disabled:opacity-0"
                                        >
                                            <ChevronUp size={20} />
                                        </button>
                                        <button 
                                            onClick={() => moveSubject(index, 'down')}
                                            disabled={index === config?.subjects.length! - 1}
                                            className="p-2 text-slate-300 dark:text-slate-700 hover:text-indigo-600 disabled:opacity-0"
                                        >
                                            <ChevronDown size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 mb-8 font-mono text-[10px] text-slate-400 break-all border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                                        <ExternalLink size={10} /> API ENDPOINT
                                    </div>
                                    {subject.apiUrl}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => startEditing(subject)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => deleteSubject(subject.id)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setDefaultSubject(subject.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                config?.defaultSubjectId === subject.id 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {config?.defaultSubjectId === subject.id ? 'Default' : 'Set Default'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

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
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-20 md:max-w-md md:mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] z-[110] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                            <header className="mb-8">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                                    <Settings size={12} /> System Configuration
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                                </h2>
                            </header>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Data Structures"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Url Slug</label>
                                    <input 
                                        type="text" 
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="e.g. data-structures"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">API Endpoint</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={formData.apiUrl}
                                            onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
                                            placeholder="https://api.example.com/data.json"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all pr-14"
                                        />
                                        <button 
                                            onClick={testApi}
                                            disabled={testingApi}
                                            className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-white dark:bg-slate-800 text-indigo-600 rounded-xl hover:bg-slate-100 transition-all dark:hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            {testingApi ? <RefreshCw className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button 
                                        onClick={() => { setShowAddModal(false); setEditingSubject(null); }}
                                        className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 font-black rounded-2xl transition-all"
                                    > Cancel </button>
                                    <button 
                                        onClick={editingSubject ? updateSubject : addSubject}
                                        disabled={saving}
                                        className="flex-[2] p-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                        {editingSubject ? 'Commit Changes' : 'Initialize Subject'}
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
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-20 md:max-w-md md:mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] z-[110] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                            <header className="mb-6">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                                    <RefreshCw size={12} /> Migration Tools
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Import Subjects</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Sync configurations from your legacy JsonBin instance.</p>
                            </header>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Bin Identifier</label>
                                    <input 
                                        type="text" 
                                        value={legacyBinId}
                                        onChange={e => setLegacyBinId(e.target.value)}
                                        placeholder="e.g. 6618beedfe54b232679..."
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => setShowImportDialog(false)}
                                        className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 font-black rounded-2xl transition-all"
                                    > Cancel </button>
                                    <button 
                                        onClick={handleImport}
                                        disabled={importing}
                                        className="flex-[2] p-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {importing ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                                        Start Import
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
