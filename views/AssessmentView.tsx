import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Ruler, Save, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { Client, Assessment } from '../types';
import { uploadAssessmentPhoto } from '../services/supabase/domains/storageDomain';
import { createAssessment } from '../services/supabase/domains/assessmentsDomain';
import PageHeader from '../components/PageHeader';

interface AssessmentViewProps {
    user: any;
    client: Client;
    onBack: () => void;
    onSave: (assessment: Assessment) => void;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ user, client, onBack, onSave }) => {
    const [activeTab, setActiveTab] = useState<'measures' | 'photos'>('measures');
    const [weight, setWeight] = useState<string>('');
    const [bodyFat, setBodyFat] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Photo Upload State
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

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const fileList: File[] = Array.from(files);

        setUploading(true);

        for (const file of fileList) {
            if (!file.type.startsWith('image/')) {
                console.warn('File is not an image:', file.name);
                continue;
            }

            const photoUrl = await uploadAssessmentPhoto(file, client.id, user?.id || 'demo');

            if (photoUrl) {
                setPhotos(prev => [...prev, photoUrl]);
            } else {
                const localUrl = URL.createObjectURL(file);
                setPhotos(prev => [...prev, localUrl]);
            }
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);

        const assessment: Assessment = {
            date: new Date().toISOString(),
            weight: parseFloat(weight) || 0,
            bodyFat: parseFloat(bodyFat) || undefined,
            measures: Object.entries(measures as Record<string, string>).reduce<Record<string, number>>((acc, [k, v]) => ({ ...acc, [k]: parseFloat(v) || 0 }), {}),
            skinfolds: Object.entries(skinfolds as Record<string, string>).reduce<Record<string, number>>((acc, [k, v]) => ({ ...acc, [k]: parseFloat(v) || 0 }), {}),
            photos: photos
        };

        if (user?.id && client.id) {
            await createAssessment({
                client_id: client.id,
                coach_id: user.id,
                date: new Date().toISOString().split('T')[0],
                weight: parseFloat(weight) || undefined,
                body_fat: parseFloat(bodyFat) || undefined,
                measures: assessment.measures,
                skinfolds: assessment.skinfolds,
                photos: photos
            });
        }

        setSaving(false);
        onSave(assessment);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32 font-sans bg-[var(--bg-void)]">
            {/* Standardized Header */}
            <PageHeader
                title="NOVA AVALIAÇÃO"
                subtitle={client.name}
                onBack={onBack}
                accentColor="cyan"
                rightSlot={
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="size-11 rounded-2xl flex items-center justify-center transition-all bg-blue-600 text-white shadow-glow disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} strokeWidth={2.5} />
                        )}
                    </motion.button>
                }
            />

            <main className="px-5 space-y-7 -mt-2 relative z-10">
                {/* Date & Core Metrics Card */}
                <motion.div
                    className="glass-card rounded-[24px] p-5 shadow-2xl relative overflow-hidden group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-[14px] bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                <Calendar size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Data</p>
                                <p className="font-bold text-white text-[15px]">{new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>

                        <div className="w-px h-10 bg-white/10 mx-2" />

                        <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">Peso (kg)</p>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="00.0"
                                className="w-24 bg-slate-900/40 rounded-xl py-2 px-3 text-center font-black text-white outline-none focus:ring-2 ring-blue-500/50 border border-white/5 transition-all text-lg"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Premium Segmented Control (Tabs) */}
                <motion.div
                    className="flex p-1 bg-slate-900/60 rounded-[18px] backdrop-blur-md border border-white/5 relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <button
                        onClick={() => setActiveTab('measures')}
                        className={`relative z-10 flex-1 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'measures' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Medidas
                    </button>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`relative z-10 flex-1 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'photos' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Fotos
                    </button>
                    {/* Active Background Pill */}
                    <motion.div
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-[14px] shadow-glow z-0"
                        animate={{ left: activeTab === 'measures' ? '4px' : 'calc(50%)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'measures' ? (
                        <motion.div
                            key="measures"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-8 pb-10"
                        >
                            {/* Circumferences Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <Ruler size={14} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-[13px] font-black text-white uppercase tracking-widest">Circunferências <span className="text-slate-500">(cm)</span></h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(measures).map(([key, value]) => (
                                        <div key={key} className="glass-card p-4 rounded-2xl relative overflow-hidden group focus-within:border-emerald-500/40 transition-colors">
                                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl group-focus-within:bg-emerald-500/10 transition-colors" />
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] block mb-2 relative z-10">
                                                {labelsMap[key] || key}
                                            </label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleMeasureChange(key as keyof typeof measures, e.target.value)}
                                                className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder:text-slate-700 relative z-10"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Skinfolds Section */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <div className="size-3 border-[2px] border-blue-400 rounded-full" />
                                    </div>
                                    <h3 className="text-[13px] font-black text-white uppercase tracking-widest">Dobras Cutâneas <span className="text-slate-500">(mm)</span></h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(skinfolds).map(([key, value]) => (
                                        <div key={key} className="glass-card p-4 rounded-2xl relative overflow-hidden group focus-within:border-blue-500/40 transition-colors">
                                            <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-blue-500/5 rounded-full blur-xl group-focus-within:bg-blue-500/10 transition-colors" />
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] block mb-2 relative z-10">
                                                {labelsMap[key] || key}
                                            </label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleSkinfoldChange(key as keyof typeof skinfolds, e.target.value)}
                                                className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder:text-slate-700 relative z-10"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="photos"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-5"
                        >
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />

                            {/* Upload Hero Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full relative h-[160px] rounded-[24px] border border-blue-500/20 bg-gradient-to-br from-blue-900/10 to-indigo-900/5 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-blue-900/20 transition-all active:scale-[0.98] overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

                                {uploading ? (
                                    <>
                                        <div className="size-8 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest mt-1">Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="size-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <Camera size={26} className="text-blue-400" />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <span className="block text-sm font-black text-white uppercase tracking-wider mb-1">Adicionar Foto</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Toque para abrir a câmera ou galeria</span>
                                        </div>
                                    </>
                                )}
                            </button>

                            {/* Photos gallery grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {photos.map((photo, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden relative group border border-white/5"
                                    >
                                        <img
                                            src={photo}
                                            alt={`Foto ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        {/* Overlay gradient for readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                        {/* Delete button */}
                                        <button
                                            onClick={() => handleRemovePhoto(idx)}
                                            className="absolute top-3 right-3 size-9 rounded-full bg-red-500/90 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-105"
                                        >
                                            <Trash2 size={16} className="text-white" />
                                        </button>

                                        {/* Photo indicator */}
                                        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                                <CheckCircle2 size={12} className="text-emerald-400" />
                                                Foto {idx + 1}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {photos.length === 0 && !uploading && (
                                <div className="text-center py-10 px-6 glass-card rounded-3xl mt-6">
                                    <div className="size-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Camera size={24} className="text-slate-600" />
                                    </div>
                                    <p className="text-slate-300 font-bold mb-1">Nenhum registro visual</p>
                                    <p className="text-slate-500 text-xs">Acompanhar a evolução visual é fundamental para manter o aluno motivado.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AssessmentView;
