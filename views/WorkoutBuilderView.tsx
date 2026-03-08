import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Dumbbell, Timer, Zap, Layers, Trash2, Save, Heart, Activity, Mountain, Footprints, Sparkles, Copy, FileText, Star } from 'lucide-react';
import { Client, ExerciseCategory, TrainingMethod, WorkoutExercise, ExerciseSet, WorkoutTemplate, CustomMethod } from '../types';
import { saveWorkout } from '../services/supabase/domains/workoutsDomain';
import { createScopedLogger } from '../services/appLogger';
import { fetchAllExercises, type Exercise as CatalogExercise, type MovementPattern } from '../services/exerciseService';
import { WORKOUT_TEMPLATES, type WorkoutTemplate as EngineWorkoutTemplate } from '../services/ai/workoutTemplates';

interface WorkoutBuilderViewProps {
    user: any;
    client: Client | null;
    onBack: () => void;
    onSave: () => void;
}

const workoutBuilderViewLogger = createScopedLogger('WorkoutBuilderView');

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

const PREMIUM_METHOD_INFOS: CustomMethod[] = [
    {
        id: 'dropset',
        name: 'Drop-Set',
        description: 'Reduz a carga sem descanso para ampliar o estímulo metabólico no fim da série.',
        icon: '⬇️',
        structure: {
            sets: 3,
            repsPattern: '10-12 + queda de carga',
            restPattern: '15-20s',
            specialInstructions: 'Use apenas na última série do exercício principal.'
        },
        createdBy: 'system'
    },
    {
        id: 'restPause',
        name: 'Rest-Pause',
        description: 'Quebra a série com pausas curtas para acumular repetições de alta qualidade.',
        icon: '⏸️',
        structure: {
            sets: 3,
            repsPattern: '6-8 + mini blocos',
            restPattern: '10-15s',
            specialInstructions: 'Ideal para compostos com boa técnica e carga controlada.'
        },
        createdBy: 'system'
    },
    {
        id: 'myo',
        name: 'Myo Reps',
        description: 'Usa ativação inicial e blocos curtos subsequentes para eficiência em hipertrofia.',
        icon: '⚡',
        structure: {
            sets: 4,
            repsPattern: '12-15 + blocos de 3-5 reps',
            restPattern: '15s',
            specialInstructions: 'Prefira exercícios seguros e estáveis.'
        },
        createdBy: 'system'
    },
    {
        id: 'cluster',
        name: 'Cluster Set',
        description: 'Fragmenta uma série pesada em pequenas repetições com micro pausas.',
        icon: '🧱',
        structure: {
            sets: 4,
            repsPattern: '2-3 reps por bloco',
            restPattern: '15-20s',
            specialInstructions: 'Útil para força técnica com baixa fadiga local.'
        },
        createdBy: 'system'
    }
];

function normalizeMuscleLabel(value?: string | null): string {
    if (!value) return 'Geral';
    return value
        .replace(/_/g, ' ')
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function mapCatalogCategory(exercise: CatalogExercise): ExerciseCategory {
    if (exercise.category === 'mobilidade') return 'mobilidade';
    if (exercise.category === 'cardio') {
        if (/corrida|esteira|trote|sprint/i.test(exercise.name)) return 'corrida';
        if (/escada|stair|degrau/i.test(exercise.name)) return 'escada';
        return 'cardio';
    }
    if (exercise.category === 'core') return 'funcional';
    if (/salto|plio|jump|bound/i.test(exercise.name)) return 'pliometria';
    if (/sport|esporte|agility|sprint/i.test(exercise.slug || exercise.name)) return 'esporte';
    return 'musculacao';
}

function buildDefaultSet(method: TrainingMethod = 'simples'): ExerciseSet {
    return {
        method,
        reps: '10-12',
        load: '',
        rest: '60s',
        time: '',
    };
}

function mapCatalogExerciseToWorkout(exercise: CatalogExercise, overrideSet?: Partial<ExerciseSet>): WorkoutExercise {
    return {
        id: exercise.id,
        name: exercise.name,
        category: mapCatalogCategory(exercise),
        sets: [{ ...buildDefaultSet(), ...overrideSet }],
        targetMuscle: normalizeMuscleLabel(exercise.primary_muscle),
        videoUrl: exercise.video_url,
        notes: exercise.execution_tips || ''
    };
}

function mapGoalToTemplateCategory(goal?: string): WorkoutTemplate['category'] {
    if (goal === 'forca') return 'forca';
    if (goal === 'emagrecimento') return 'emagrecimento';
    if (goal === 'condicionamento') return 'condicionamento';
    if (goal === 'saude') return 'reabilitacao';
    return 'hipertrofia';
}

function mapLevelToDifficulty(level?: string): WorkoutTemplate['difficulty'] {
    if (level === 'atleta' || level === 'avancado') return 'avancado';
    if (level === 'intermediario') return 'intermediario';
    return 'iniciante';
}

function buildSetOverridesFromIntensity(intensity: EngineWorkoutTemplate['days'][number]['slots'][number]['intensity']): Partial<ExerciseSet> {
    if (intensity === 'very_high') return { reps: '4-6', rest: '120s' };
    if (intensity === 'high') return { reps: '6-8', rest: '90s' };
    if (intensity === 'moderate') return { reps: '8-12', rest: '75s' };
    if (intensity === 'low') return { reps: '12-15', rest: '60s' };
    return { reps: '15-20', rest: '45s' };
}

function scoreCatalogExercise(exercise: CatalogExercise, slot: EngineWorkoutTemplate['days'][number]['slots'][number]) {
    let score = 0;
    if (exercise.movement_pattern === slot.movement_pattern) score += 50;
    if (slot.target_muscles?.some((muscle) => normalizeMuscleLabel(exercise.primary_muscle).toLowerCase().includes(muscle.toLowerCase()))) score += 20;
    if (slot.preferred_load === 'axial' && exercise.spinal_load === 'alto') score += 8;
    if (slot.preferred_load === 'non_axial' && exercise.spinal_load === 'baixo') score += 8;
    if (slot.allow_unilateral && exercise.is_unilateral) score += 4;
    if (exercise.is_machine) score += 2;
    return score;
}

function resolveTemplateExercises(template: EngineWorkoutTemplate, catalog: CatalogExercise[]): WorkoutExercise[] {
    const usedIds = new Set<string>();
    const resolvedExercises: WorkoutExercise[] = [];

    template.days.forEach((day) => {
        day.slots.forEach((slot) => {
            const selected = [...catalog]
                .filter((exercise) => exercise.movement_pattern === slot.movement_pattern && !usedIds.has(exercise.id))
                .sort((a, b) => scoreCatalogExercise(b, slot) - scoreCatalogExercise(a, slot))[0];

            if (!selected) return;

            usedIds.add(selected.id);
            resolvedExercises.push({
                ...mapCatalogExerciseToWorkout(selected, buildSetOverridesFromIntensity(slot.intensity)),
                id: `${day.day_id}-${slot.id}-${selected.id}`,
                notes: `${day.label}${selected.execution_tips ? ` • ${selected.execution_tips}` : ''}`
            });
        });
    });

    return resolvedExercises;
}

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
    const [catalogExercises, setCatalogExercises] = useState<CatalogExercise[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);

    // Muscle group lists
    const upperMuscles = ['Peito', 'Costas', 'Ombro/Trapézio', 'Bíceps', 'Tríceps'];
    const lowerMuscles = ['Quadríceps', 'Posterior de Coxa', 'Glúteo', 'Panturrilha', 'Parte Interna da Coxa'];

    useEffect(() => {
        let cancelled = false;

        const loadCatalog = async () => {
            setIsCatalogLoading(true);
            try {
                const allExercises = await fetchAllExercises();
                if (!cancelled) {
                    setCatalogExercises(allExercises);
                }
            } catch (error) {
                workoutBuilderViewLogger.error('Error loading exercise catalog for workout builder', error, {
                    coachId: user?.id || 'unknown'
                });
                if (!cancelled) {
                    setCatalogExercises([]);
                }
            } finally {
                if (!cancelled) {
                    setIsCatalogLoading(false);
                }
            }
        };

        void loadCatalog();
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    // Get available exercises based on filters
    const availableExercises = useMemo(() => catalogExercises
        .map((exercise) => mapCatalogExerciseToWorkout(exercise))
        .filter(ex => {
        if (ex.category !== selectedCategory) return false;
        if (selectedCategory === 'musculacao' && selectedMuscleGroup) {
            return ex.targetMuscle === selectedMuscleGroup;
        }
        return true;
    }), [catalogExercises, selectedCategory, selectedMuscleGroup]);

    const availableTemplates = useMemo(() => WORKOUT_TEMPLATES.map((template) => {
        const exercisesForTemplate = resolveTemplateExercises(template, catalogExercises);
        return {
            id: template.template_id,
            name: template.name,
            description: `${template.frequency}x por semana • ${template.days.map((day) => day.label).join(' / ')}`,
            duration: `${template.frequency} sessões`,
            difficulty: mapLevelToDifficulty(template.suitable_levels[0]),
            exercises: exercisesForTemplate,
            tags: template.suitable_goals,
            category: mapGoalToTemplateCategory(template.suitable_goals[0]),
            createdBy: 'system',
            isPublic: true
        } satisfies WorkoutTemplate;
    }), [catalogExercises]);

    const hasUsableTemplates = useMemo(
        () => availableTemplates.some((template) => template.exercises.length > 0),
        [availableTemplates]
    );

    const estimatedDurationMinutes = useMemo(() => {
        const totalSets = exercises.reduce((acc, exercise) => acc + exercise.sets.length, 0);
        if (totalSets === 0) return 0;
        return Math.max(15, Math.round(totalSets * 2.5));
    }, [exercises]);

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
            workoutBuilderViewLogger.error('Error saving workout', error, {
                clientId: client.id,
                coachId: user.id || 'unknown',
                exercisesCount: exercises.length
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button onClick={onBack} aria-label="Voltar" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="font-black text-sm uppercase tracking-widest text-slate-400">Builder Pro</h1>
                        <p className="font-bold text-white text-xs">{client?.name || 'Template'}</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!client || !user || exercises.length === 0 || workoutTitle.trim().length === 0}
                        aria-label="Salvar treino manual"
                        className={`p-2 rounded-xl transition-all ${client && user && exercises.length > 0 && workoutTitle.trim().length > 0 ? 'bg-blue-600 text-white shadow-glow hover:bg-blue-500' : 'bg-slate-800 text-slate-500'}`}
                    >
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
                        disabled={isCatalogLoading || !hasUsableTemplates}
                        aria-label="Abrir templates de treino"
                        className={`flex-1 glass-card p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${isCatalogLoading || !hasUsableTemplates ? 'text-slate-600 cursor-not-allowed opacity-60' : 'text-slate-400 hover:text-white hover:border-blue-500/50'}`}
                    >
                        <FileText size={16} />
                        Usar Template
                    </button>
                    <button
                        onClick={() => setShowMethodInfo('info')}
                        aria-label="Abrir métodos de treino"
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
                                    <button onClick={() => duplicateExercise(index)} aria-label={`Duplicar exercício ${exercise.name}`} className="text-slate-600 hover:text-blue-400 p-1" title="Duplicar">
                                        <Copy size={16} />
                                    </button>
                                    <button onClick={() => handleRemoveExercise(index)} aria-label={`Remover exercício ${exercise.name}`} className="text-slate-600 hover:text-red-400 p-1">
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
                                                aria-label={`Remover série ${setIndex + 1} do exercício ${exercise.name}`}
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
                                                aria-label={`Carga da série ${setIndex + 1} do exercício ${exercise.name}`}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="kg"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={set.reps}
                                                onChange={(e) => updateSet(index, setIndex, 'reps', e.target.value)}
                                                aria-label={`Repetições da série ${setIndex + 1} do exercício ${exercise.name}`}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="-"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={set.time || ''}
                                                onChange={(e) => updateSet(index, setIndex, 'time', e.target.value)}
                                                aria-label={`Tempo da série ${setIndex + 1} do exercício ${exercise.name}`}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="s"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={set.rest}
                                                onChange={(e) => updateSet(index, setIndex, 'rest', e.target.value)}
                                                aria-label={`Descanso da série ${setIndex + 1} do exercício ${exercise.name}`}
                                                className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-xs font-bold font-mono focus:ring-1 ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                                                placeholder="s"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                value={set.method}
                                                onChange={(e) => updateSet(index, setIndex, 'method', e.target.value)}
                                                aria-label={`Método da série ${setIndex + 1} do exercício ${exercise.name}`}
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
                                    aria-label={`Adicionar série ao exercício ${exercise.name}`}
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
                    aria-label="Adicionar exercício ao treino manual"
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
                            <p className="text-2xl font-black text-blue-400">{estimatedDurationMinutes}</p>
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
                                <button onClick={() => setShowExerciseSelector(false)} aria-label="Fechar biblioteca de exercícios" className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
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
                                {isCatalogLoading && (
                                    <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        Carregando catálogo real de exercícios...
                                    </div>
                                )}

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

                                {!isCatalogLoading && availableExercises.length === 0 && (
                                    <div className="py-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest opacity-50">
                                        {catalogExercises.length === 0
                                            ? 'Catálogo real indisponível no momento'
                                            : `Nenhum exercício encontrado para ${categoryLabels[selectedCategory]}`}
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
                                <button onClick={() => setShowTemplates(false)} aria-label="Fechar templates de treino" className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            <div className="space-y-3 pb-32">
                                {isCatalogLoading && (
                                    <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        Montando templates com o catálogo real...
                                    </div>
                                )}

                                {availableTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => loadTemplate(template)}
                                        disabled={template.exercises.length === 0}
                                        className={`w-full glass-card p-4 rounded-2xl text-left transition-all ${template.exercises.length === 0 ? 'opacity-60 cursor-not-allowed' : 'hover:border-purple-500/50 active:scale-[0.98]'}`}
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

                                {!isCatalogLoading && !hasUsableTemplates && (
                                    <div className="py-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest opacity-70">
                                        Nenhum template pôde ser montado com o catálogo atual
                                    </div>
                                )}
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
                                <button onClick={() => setShowMethodInfo(null)} aria-label="Fechar métodos de treino" className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </header>

                            <div className="space-y-4 pb-32">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Métodos Premium ⭐</h3>
                                {PREMIUM_METHOD_INFOS.map(method => (
                                    <div key={method.id} className="glass-card p-4 rounded-2xl border-l-4 border-cyan-500/40">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-2xl">{method.icon}</span>
                                            <div>
                                                <h4 className="font-bold text-white">{method.name}</h4>
                                                <p className="text-[10px] text-slate-500">{method.structure.repsPattern} • {method.structure.restPattern}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2">{method.description}</p>
                                        {method.structure.specialInstructions && (
                                            <p className="text-[10px] text-blue-400 italic">💡 {method.structure.specialInstructions}</p>
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
