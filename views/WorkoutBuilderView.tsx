import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Dumbbell, Timer, Zap, Layers, Trash2, Save, Heart, Activity, Mountain, Footprints, Sparkles, Copy, FileText, Star } from 'lucide-react';
import { Client, ExerciseCategory, TrainingMethod, WorkoutExercise, ExerciseSet, WorkoutTemplate } from '../types';
import { mockExercises, mockTemplates, mockCustomMethods } from '../mocks/demoData';
import { saveWorkout } from '../services/supabaseClient';

interface WorkoutBuilderViewProps {
    user: any;
    client: Client | null;
    onBack: () => void;
    onSave: () => void;
}

// ============ METHOD COLORS & LABELS ============
const methodColors: Record<TrainingMethod, string> = {
    // MVP Methods
    'simples': 'from-slate-600 to-slate-500',
    'piramide': 'from-purple-600 to-indigo-500',
    'biset': 'from-blue-600 to-cyan-500',
    'giantset': 'from-amber-500 to-orange-500',
    // Premium Methods
    'dropset': 'from-red-600 to-rose-500',
    'restPause': 'from-pink-600 to-rose-500',
    'myo': 'from-fuchsia-600 to-pink-500',
    'cluster': 'from-violet-600 to-purple-500',
    'fst7': 'from-emerald-600 to-teal-500',
    'gvt': 'from-lime-600 to-green-500',
    '21s': 'from-yellow-500 to-amber-500',
    'mechanical': 'from-orange-600 to-red-500',
    'custom': 'from-cyan-600 to-blue-500',
};

const methodLabels: Record<TrainingMethod, string> = {
    // MVP
    'simples': 'Série Normal',
    'piramide': 'Pirâmide',
    'biset': 'Bi-Set / Super Série',
    'giantset': 'Série Gigante',
    // Premium
    'dropset': 'Drop-Set ⭐',
    'restPause': 'Rest-Pause ⭐',
    'myo': 'Myo Reps ⭐',
    'cluster': 'Cluster Set ⭐',
    'fst7': 'FST-7 ⭐',
    'gvt': 'GVT (10x10) ⭐',
    '21s': 'Método 21 ⭐',
    'mechanical': 'Mechanical Drop ⭐',
    'custom': 'Personalizado ⭐',
};

const mvpMethods: TrainingMethod[] = ['simples', 'piramide', 'biset', 'giantset'];
const premiumMethods: TrainingMethod[] = ['dropset', 'restPause', 'myo', 'cluster', 'fst7', 'gvt', '21s', 'mechanical', 'custom'];

// ============ CATEGORY ICONS & LABELS ============
const categoryIcons: Record<ExerciseCategory, React.ElementType> = {
    'musculacao': Dumbbell,
    'cardio': Heart,
    'corrida': Footprints,
    'escada': Mountain,
    'funcional': Zap,
    'pliometria': Activity,
    'mobilidade': Sparkles,
    'esporte': Layers,
};

const categoryLabels: Record<ExerciseCategory, string> = {
    'musculacao': 'Musculação',
    'cardio': 'Cardio',
    'corrida': 'Corrida',
    'escada': 'Escada',
    'funcional': 'Funcional',
    'pliometria': 'Pliometria',
    'mobilidade': 'Mobilidade',
    'esporte': 'Esporte',
};

const WorkoutBuilderView: React.FC<WorkoutBuilderViewProps> = ({ user, client, onBack, onSave }) => {
    // State declarations
    const [workoutTitle, setWorkoutTitle] = useState('Novo Treino');
    const [workoutNotes, setWorkoutNotes] = useState('');
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showMethodInfo, setShowMethodInfo] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('musculacao');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
    const [bodyPartFilter, setBodyPartFilter] = useState<'superior' | 'inferior'>('superior');

    // Muscle group lists
    const upperMuscles = ['Peito', 'Costas', 'Ombro/Trapézio', 'Bíceps', 'Tríceps'];
    const lowerMuscles = ['Quadríceps', 'Posterior de Coxa', 'Glúteo', 'Panturrilha', 'Parte Interna da Coxa'];

    // Get available exercises based on filters
    const availableExercises = mockExercises.filter(ex => {
        if (ex.category !== selectedCategory) return false;
        if (selectedCategory === 'musculacao' && selectedMuscleGroup) {
            return ex.targetMuscle === selectedMuscleGroup;
        }
        return true;
    });

    // Add exercise to workout
    const handleAddExercise = (exercise: WorkoutExercise) => {
        const newExercise = {
            ...exercise,
            id: `${exercise.id}-${Date.now()}`,
            sets: [...exercise.sets]
        };
        setExercises([...exercises, newExercise]);
        setShowExerciseSelector(false);
    };

    // Remove exercise
    const handleRemoveExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    // Duplicate exercise
    const duplicateExercise = (index: number) => {
        const exerciseToDuplicate = exercises[index];
        const duplicated = {
            ...exerciseToDuplicate,
            id: `${exerciseToDuplicate.id}-copy-${Date.now()}`
        };
        const newExercises = [...exercises];
        newExercises.splice(index + 1, 0, duplicated);
        setExercises(newExercises);
    };

    // Add set to exercise
    const addSet = (exerciseIndex: number) => {
        const newExercises = [...exercises];
        const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
        newExercises[exerciseIndex].sets.push({ ...lastSet });
        setExercises(newExercises);
    };

    // Remove set from exercise
    const removeSet = (exerciseIndex: number, setIndex: number) => {
        const newExercises = [...exercises];
        if (newExercises[exerciseIndex].sets.length > 1) {
            newExercises[exerciseIndex].sets.splice(setIndex, 1);
            setExercises(newExercises);
        }
    };

    // Update set property
    const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
        const newExercises = [...exercises];
        (newExercises[exerciseIndex].sets[setIndex] as any)[field] = value;
        setExercises(newExercises);
    };

    // Update exercise notes
    const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].notes = notes;
        setExercises(newExercises);
    };

    // Load template
    const loadTemplate = (template: WorkoutTemplate) => {
        setWorkoutTitle(template.name);
        setExercises([...template.exercises]);
        setShowTemplates(false);
    };

    const handleSave = async () => {
        if (!client || !user) return;

        try {
            // Determinar descrição baseado nos grupos musculares
            const muscleGroups = [...new Set(exercises.map(e => e.targetMuscle).filter(Boolean))];
            const splitDescription = muscleGroups.slice(0, 3).join('/') || 'Treino Geral';

            const workoutToSave = {
                client_id: client.id,
                coach_id: user.id || 'unknown',
                title: workoutTitle,
                objective: workoutNotes || 'Treino Personalizado',
                duration: '60 min',
                splits: [{
                    id: `split-${Date.now()}`,
                    name: 'A',
                    description: splitDescription,
                    exercises: exercises
                }]
            };

            await saveWorkout(workoutToSave);
            onSave();
        } catch (error) {
            console.error('Error saving workout:', error);
        }
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
                        <h1 className="font-black text-sm uppercase tracking-widest text-slate-400">Builder Pro</h1>
                        <p className="font-bold text-white text-xs">{client?.name || 'Template'}</p>
                    </div>
                    <button onClick={handleSave} className="p-2 rounded-xl bg-blue-600 text-white shadow-glow hover:bg-blue-500 transition-all">
                        <Save size={20} />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-6">
                {/* Workout Title Input */}
                <div className="glass-card p-4 rounded-2xl space-y-3">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 block">Nome do Treino</label>
                        <input
                            type="text"
                            value={workoutTitle}
                            onChange={(e) => setWorkoutTitle(e.target.value)}
                            className="w-full bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-600"
                            placeholder="Ex: Treino de Peito"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1 block">Observações do Treino</label>
                        <textarea
                            value={workoutNotes}
                            onChange={(e) => setWorkoutNotes(e.target.value)}
                            className="w-full bg-slate-900/50 rounded-xl p-3 text-sm text-white outline-none resize-none placeholder:text-slate-600 focus:ring-1 ring-blue-500"
                            placeholder="Ex: Focar na contração, cadência controlada..."
                            rows={2}
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="flex-1 glass-card p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:border-blue-500/50 transition-all"
                    >
                        <FileText size={16} />
                        Usar Template
                    </button>
                    <button
                        onClick={() => setShowMethodInfo('info')}
                        className="flex-1 glass-card p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:border-purple-500/50 transition-all"
                    >
                        <Star size={16} />
                        Métodos Premium
                    </button>
                </div>

                {/* Exercises List */}
                <AnimatePresence>
                    {exercises.map((exercise, index) => (
                        <motion.div
                            key={exercise.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card rounded-[24px] overflow-hidden border border-white/5"
                        >
                            {/* Exercise Header */}
                            <div className="p-4 bg-white/5 flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl bg-gradient-to-br ${methodColors[exercise.sets[0]?.method || 'simples']} shadow-lg`}>
                                        {React.createElement(categoryIcons[exercise.category] || Dumbbell, { size: 18, className: 'text-white' })}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg leading-tight">{exercise.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{exercise.targetMuscle}</p>
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-gradient-to-r ${methodColors[exercise.sets[0]?.method || 'simples']} text-white`}>
                                                {methodLabels[exercise.sets[0]?.method || 'simples']?.replace(' ⭐', '')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => duplicateExercise(index)} className="text-slate-600 hover:text-blue-400 p-1" title="Duplicar">
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => handleRemoveExercise(index)} className="text-slate-600 hover:text-red-400 p-1">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Sets */}
                            <div className="p-4 space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">
                                    <div className="col-span-1 text-center">Set</div>
                                    <div className="col-span-3">Carga</div>
                                    <div className="col-span-2">Reps</div>
                                    <div className="col-span-2">Tempo</div>
                                    <div className="col-span-2">Desc.</div>
                                    <div className="col-span-2 text-center">Método</div>
                                </div>

                                {exercise.sets.map((set, setIndex) => (
                                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center group">
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                onClick={() => removeSet(index, setIndex)}
                                                className="size-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                            >
                                                {setIndex + 1}
                                            </button>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="text"
                                                value={set.load}
                                                onChange={(e) => updateSet(index, setIndex, 'load', e.target.value)}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="kg"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={set.reps}
                                                onChange={(e) => updateSet(index, setIndex, 'reps', e.target.value)}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="-"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={set.time || ''}
                                                onChange={(e) => updateSet(index, setIndex, 'time', e.target.value)}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="s"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={set.rest}
                                                onChange={(e) => updateSet(index, setIndex, 'rest', e.target.value)}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="s"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                value={set.method}
                                                onChange={(e) => updateSet(index, setIndex, 'method', e.target.value)}
                                                className={`appearance-none w-full text-[8px] font-black px-1 py-2 rounded uppercase tracking-wider bg-gradient-to-r ${methodColors[set.method || 'simples']} text-white/90 outline-none cursor-pointer hover:brightness-110 transition-all text-center`}
                                            >
                                                <optgroup label="MVP">
                                                    {mvpMethods.map(m => (
                                                        <option key={m} value={m} className="bg-slate-900 text-slate-300">
                                                            {methodLabels[m]}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Premium ⭐">
                                                    {premiumMethods.map(m => (
                                                        <option key={m} value={m} className="bg-slate-900 text-slate-300">
                                                            {methodLabels[m]}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addSet(index)}
                                    className="w-full py-2 mt-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-dashed border-white/10 hover:border-white/20"
                                >
                                    <Plus size={14} /> Adicionar Série
                                </button>

                                {/* Exercise Notes */}
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <input
                                        type="text"
                                        value={exercise.notes || ''}
                                        onChange={(e) => updateExerciseNotes(index, e.target.value)}
                                        className="w-full bg-transparent text-xs text-slate-400 outline-none placeholder:text-slate-600"
                                        placeholder="📝 Observações deste exercício..."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add Exercise Button */}
                <button
                    onClick={() => setShowExerciseSelector(true)}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-slate-400 font-bold flex flex-col items-center justify-center gap-2 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all group"
                >
                    <div className="size-10 rounded-full bg-slate-800 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                        <Plus size={24} />
                    </div>
                    Adicionar Exercício
                </button>

                {/* Stats */}
                {exercises.length > 0 && (
                    <div className="glass-card p-4 rounded-2xl flex justify-around">
                        <div className="text-center">
                            <p className="text-2xl font-black text-white">{exercises.length}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Exercícios</p>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-white">{exercises.reduce((acc, e) => acc + e.sets.length, 0)}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Séries</p>
                        </div>
                        <div className="w-px bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-blue-400">~45</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Minutos</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Exercise Selector Modal */}
            <AnimatePresence>
                {showExerciseSelector && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col"
                    >
                        <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
                            <header className="flex justify-between items-center mb-6 pt-4">
                                <h2 className="text-xl font-black text-white">Biblioteca de Exercícios</h2>
                                <button onClick={() => setShowExerciseSelector(false)} className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            {/* Categories */}
                            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
                                {(Object.keys(categoryIcons) as ExerciseCategory[]).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); setSelectedMuscleGroup(null); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === cat
                                            ? 'bg-white text-slate-950 shadow-glow'
                                            : 'bg-slate-900 text-slate-500 border border-white/5'
                                            }`}
                                    >
                                        {React.createElement(categoryIcons[cat], { size: 14 })}
                                        {categoryLabels[cat]}
                                    </button>
                                ))}
                            </div>

                            {/* Sub-Category Filters (Musculação) */}
                            {selectedCategory === 'musculacao' && (
                                <div className="space-y-4 mb-6 animate-fade-in">
                                    <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl">
                                        <button
                                            onClick={() => setBodyPartFilter('superior')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${bodyPartFilter === 'superior' ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Superior
                                        </button>
                                        <button
                                            onClick={() => setBodyPartFilter('inferior')}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${bodyPartFilter === 'inferior' ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Inferior
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(bodyPartFilter === 'superior' ? upperMuscles : lowerMuscles).map(muscle => (
                                            <button
                                                key={muscle}
                                                onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === muscle ? null : muscle)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border transition-all ${selectedMuscleGroup === muscle
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-transparent border-white/10 text-slate-400 hover:border-white/30'
                                                    }`}
                                            >
                                                {muscle}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* List */}
                            <div className="space-y-3 pb-32">
                                {availableExercises.map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => handleAddExercise(ex)}
                                        className="w-full glass-card p-4 rounded-2xl flex items-center gap-4 text-left group hover:border-blue-500/50 transition-all active:scale-[0.98]"
                                    >
                                        <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                            {React.createElement(categoryIcons[ex.category] || Dumbbell, { size: 20 })}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{ex.targetMuscle || 'Geral'}</p>
                                                {ex.sets[0]?.effortZone && (
                                                    <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold">
                                                        Zona {ex.sets[0].effortZone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-glow">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {availableExercises.length === 0 && (
                                    <div className="py-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest opacity-50">
                                        Nenhum exercício encontrado para {categoryLabels[selectedCategory]}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Templates Modal */}
            <AnimatePresence>
                {showTemplates && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col"
                    >
                        <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
                            <header className="flex justify-between items-center mb-6 pt-4">
                                <h2 className="text-xl font-black text-white">Templates de Treino</h2>
                                <button onClick={() => setShowTemplates(false)} className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            <div className="space-y-3 pb-32">
                                {mockTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => loadTemplate(template)}
                                        className="w-full glass-card p-4 rounded-2xl text-left hover:border-purple-500/50 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white">{template.name}</h4>
                                            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-black uppercase">
                                                {template.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-3">{template.description}</p>
                                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                                            <span>⏱️ {template.duration}</span>
                                            <span>📊 {template.exercises.length} exercícios</span>
                                        </div>
                                        {template.tags && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {template.tags.map(tag => (
                                                    <span key={tag} className="text-[8px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Method Info Modal */}
            <AnimatePresence>
                {showMethodInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col"
                    >
                        <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
                            <header className="flex justify-between items-center mb-6 pt-4">
                                <h2 className="text-xl font-black text-white">Métodos de Treino</h2>
                                <button onClick={() => setShowMethodInfo(null)} className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            <div className="space-y-4 pb-32">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Métodos Premium ⭐</h3>
                                {mockCustomMethods.map(method => (
                                    <div key={method.id} className={`glass-card p-4 rounded-2xl border-l-4 border-${method.color?.split(' ')[0].replace('from-', '')}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">{method.icon}</span>
                                            <div>
                                                <h4 className="font-bold text-white">{method.name}</h4>
                                                <p className="text-[10px] text-slate-500">{method.structure.repsPattern} • {method.structure.restPattern}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2">{method.description}</p>
                                        {method.structure.specialInstructions && (
                                            <p className="text-[10px] text-amber-400 italic">💡 {method.structure.specialInstructions}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkoutBuilderView;
