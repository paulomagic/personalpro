import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Ruler, Save, Calendar, ChevronRight } from 'lucide-react';
import { Client, Assessment } from '../types';

interface AssessmentViewProps {
    user: any;
    client: Client;
    onBack: () => void;
    onSave: (assessment: Assessment) => void;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ user, client, onBack, onSave }) => {
    const [activeTab, setActiveTab] = useState<'measures' | 'photos'>('measures');
    const [weight, setWeight] = useState<string>('');

    // Measures State (Circumferences)
    const [measures, setMeasures] = useState({
        chest: '',
        armRight: '',
        armLeft: '',
        waist: '',
        abdomen: '',
        hips: '',
        thighRight: '',
        thighLeft: '',
        calfRight: '',
        calfLeft: ''
    });

    // Skinfolds State (Basic MVP)
    const [skinfolds, setSkinfolds] = useState({
        chest: '',
        abdomen: '',
        thigh: '',
        triceps: '',
        suprailiac: '',
        subscapular: '',
        axillary: ''
    });

    // Mock Photo Upload State
    const [photos, setPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // Translation Map
    const labelsMap: { [key: string]: string } = {
        chest: 'Peitoral',
        armRight: 'Braço Dir.',
        armLeft: 'Braço Esq.',
        waist: 'Cintura',
        abdomen: 'Abdômen',
        hips: 'Quadril',
        thighRight: 'Coxa Dir.',
        thighLeft: 'Coxa Esq.',
        calfRight: 'Panturrilha Dir.',
        calfLeft: 'Panturrilha Esq.',
        thigh: 'Coxa',
        triceps: 'Tríceps',
        suprailiac: 'Suprailíaca',
        subscapular: 'Subescapular',
        axillary: 'Axilar Média'
    };

    const handleMeasureChange = (field: keyof typeof measures, value: string) => {
        setMeasures(prev => ({ ...prev, [field]: value }));
    };

    const handleSkinfoldChange = (field: keyof typeof skinfolds, value: string) => {
        setSkinfolds(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoUpload = () => {
        setUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            // Add a mock placeholder image
            const newPhoto = `https://source.unsplash.com/random/300x400/?fitness&${photos.length}`;
            // In a real app, this would be the URL returned from storage
            // Since unsplash source is deprecated sometimes, let's use a solid color placeholder or local asset if available
            // For MVP demo, we can just use a colored div placeholder representation in the UI, 
            // but here we store a string.
            setPhotos(prev => [...prev, 'photo_placeholder']);
            setUploading(false);
        }, 1500);
    };

    const handleSave = () => {
        const assessment: Assessment = {
            date: new Date().toISOString(),
            weight: parseFloat(weight) || 0,
            measures: Object.entries(measures).reduce((acc, [k, v]) => ({ ...acc, [k]: parseFloat(v) || 0 }), {}),
            skinfolds: Object.entries(skinfolds).reduce((acc, [k, v]) => ({ ...acc, [k]: parseFloat(v) || 0 }), {}),
            photos: photos
        };
        onSave(assessment);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="font-black text-sm uppercase tracking-widest text-slate-400">Nova Avaliação</h1>
                        <p className="font-bold text-white text-xs">{client.name}</p>
                    </div>
                    <button onClick={handleSave} className="p-2 rounded-xl bg-blue-600 text-white shadow-glow hover:bg-blue-500 transition-all">
                        <Save size={20} />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Date & Weight Card */}
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</p>
                            <p className="font-bold text-white text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peso (kg)</p>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="00.0"
                            className="w-20 bg-slate-900/50 rounded-lg p-1 text-center font-black text-white outline-none focus:ring-1 ring-blue-500"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-900/50 rounded-xl">
                    <button
                        onClick={() => setActiveTab('measures')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'measures' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Medidas
                    </button>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'photos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Fotos
                    </button>
                </div>

                {activeTab === 'measures' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Circumferences Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Ruler size={16} className="text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wide">Circunferências (cm)</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(measures).map(([key, value]) => (
                                    <div key={key} className="glass-card p-3 rounded-xl border border-white/5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                                            {labelsMap[key] || key}
                                        </label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => handleMeasureChange(key as keyof typeof measures, e.target.value)}
                                            className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-700"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Skinfolds Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="size-4 rounded-full border-2 border-amber-500"></div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wide">Dobras Cutâneas (mm)</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(skinfolds).map(([key, value]) => (
                                    <div key={key} className="glass-card p-3 rounded-xl border border-white/5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                                            {labelsMap[key] || key}
                                        </label>
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => handleSkinfoldChange(key as keyof typeof skinfolds, e.target.value)}
                                            className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-700"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <button
                            onClick={handlePhotoUpload}
                            disabled={uploading}
                            className="w-full h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 transition-all active:scale-[0.98]"
                        >
                            {uploading ? (
                                <div className="size-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                        <Camera size={20} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Adicionar Foto</span>
                                </>
                            )}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            {photos.map((photo, idx) => (
                                <div key={idx} className="aspect-[3/4] bg-slate-800 rounded-xl overflow-hidden relative group">
                                    {photo === 'photo_placeholder' ? (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Foto {idx + 1}</span>
                                        </div>
                                    ) : (
                                        <img src={photo} alt={`Assessment ${idx}`} className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button className="text-white font-bold text-xs uppercase tracking-widest hover:underline">Ver</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {photos.length === 0 && !uploading && (
                            <div className="text-center py-8">
                                <p className="text-slate-600 text-xs">Nenhuma foto registrada nesta avaliação.</p>
                            </div>
                        )}
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default AssessmentView;
