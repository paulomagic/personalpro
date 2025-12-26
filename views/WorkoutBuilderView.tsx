import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, MoreVertical, Dumbbell, Timer, Zap, Layers, ChevronDown, Check, Trash2, Save } from 'lucide-react';
import { Client, ExerciseCategory, TrainingMethod, WorkoutExercise, ExerciseSet } from '../types';
import { mockExercises } from '../mocks/demoData';

interface WorkoutBuilderViewProps {
    user: any;
    client: Client | null; // If null, maybe selecting for a template
    onBack: () => void;
    onSave: () => void;
}

const methodColors: Record<TrainingMethod, string> = {
    'simples': 'from-slate-700 to-slate-600',
    'piramide': 'from-purple-600 to-indigo-600',
    'biset': 'from-blue-600 to-cyan-500',
    'dropset': 'from-red-600 to-rose-500',
    'giantset': 'from-amber-500 to-orange-500',
};

const methodLabels: Record<TrainingMethod, string> = {
    'simples': 'Série Normal',
    'piramide': 'Pirâmide',
    'biset': 'Bi-Set',
    'dropset': 'Drop-Set',
    'giantset': 'Série Gigante',
};

const categoryIcons: Record<ExerciseCategory, React.ElementType> = {
    'musculacao': Dumbbell,
    'cardio': Timer,
    'funcional': Zap,
    'esporte': Layers,
};

const WorkoutBuilderView: React.FC<WorkoutBuilderViewProps> = ({ user, client, onBack, onSave }) => {
    const [workoutTitle, setWorkoutTitle] = useState('Treino A - Hipertrofia');
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('musculacao');

    // Exercise Selector State
    const availableExercises = mockExercises.filter(e => e.category === selectedCategory);

    const handleAddExercise = (exercise: WorkoutExercise) => {
        const newExercise = { ...exercise, id: Math.random().toString(36).substr(2, 9) };
        setExercises([...exercises, newExercise]);
        setShowExerciseSelector(false);
    };

    const handleRemoveExercise = (index: number) => {
        const newExercises = [...exercises];
        newExercises.splice(index, 1);
        setExercises(newExercises);
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: string) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex] = {
            ...newExercises[exerciseIndex].sets[setIndex],
            [field]: value
        };
        setExercises(newExercises);
    };

    const addSet = (exerciseIndex: number) => {
        const newExercises = [...exercises];
        const previousSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
        newExercises[exerciseIndex].sets.push({ ...previousSet }); // Clone previous set
        setExercises(newExercises);
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
                        <p className="font-bold text-white text-xs">{client?.name || 'Novo Template'}</p>
                    </div>
                    <button onClick={onSave} className="p-2 rounded-xl bg-blue-600 text-white shadow-glow hover:bg-blue-500 transition-all">
                        <Save size={20} />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-6">
                {/* Workout Title Input */}
                <div className="glass-card p-4 rounded-2xl">
                    <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 block">Nome do Treino</label>
                    <input
                        type="text"
                        value={workoutTitle}
                        onChange={(e) => setWorkoutTitle(e.target.value)}
                        className="w-full bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-600"
                        placeholder="Ex: Treino de Peito"
                    />
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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{exercise.targetMuscle}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveExercise(index)} className="text-slate-600 hover:text-red-400 p-1">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Sets */}
                            <div className="p-4 space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">
                                    <div className="col-span-1 text-center">Set</div>
                                    <div className="col-span-3">Carga</div>
                                    <div className="col-span-2">Reps</div>
                                    <div className="col-span-2">Tempo</div>
                                    <div className="col-span-2">Descanso</div>
                                </div>

                                {exercise.sets.map((set, setIndex) => (
                                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-1 flex justify-center">
                                            <div className="size-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {setIndex + 1}
                                            </div>
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
                                                placeholder="min/s"
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
                                        <div className="col-span-2 flex justify-end">
                                            {setIndex === 0 && (
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-gradient-to-r ${methodColors[set.method]} text-white/90`}>
                                                    {methodLabels[set.method] || 'Simples'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addSet(index)}
                                    className="w-full py-2 mt-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-dashed border-white/10 hover:border-white/20"
                                >
                                    <Plus size={14} /> Adicionar Série
                                </button>
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
                                <h2 className="text-xl font-black text-white">Biblioteca</h2>
                                <button onClick={() => setShowExerciseSelector(false)} className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            {/* Categories */}
                            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
                                {(['musculacao', 'cardio', 'funcional', 'esporte'] as ExerciseCategory[]).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? 'bg-white text-slate-950 shadow-glow'
                                            : 'bg-slate-900 text-slate-500 border border-white/5'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

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
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{ex.targetMuscle || 'Geral'}</p>
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
                                        Em breve mais exercícios de {selectedCategory}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkoutBuilderView;
