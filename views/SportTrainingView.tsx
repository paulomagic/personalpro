import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Save, Plus, Trash2, Activity, Flame, Target, Timer, Zap, Heart, TrendingUp } from 'lucide-react';
import { SportType, SportTrainingParams, WorkoutExercise } from '../types';
import { fetchAllExercises, type Exercise as CatalogExercise } from '../services/exerciseService';
import { createScopedLogger } from '../services/appLogger';

interface SportTrainingViewProps {
    clientName?: string;
    onBack: () => void;
    onSave: (workout: any) => void;
}

const sportTrainingLogger = createScopedLogger('SportTrainingView');

const sportConfig: Record<SportType, { icon: string; color: string; gradient: string }> = {
    futebol: {
        icon: '⚽',
        color: 'text-green-400',
        gradient: 'from-green-600 to-emerald-500'
    },
    tenis: {
        icon: '🎾',
        color: 'text-yellow-400',
        gradient: 'from-yellow-500 to-amber-500'
    },
    natacao: {
        icon: '🏊',
        color: 'text-blue-400',
        gradient: 'from-blue-500 to-cyan-500'
    },
    corrida: {
        icon: '🏃',
        color: 'text-orange-400',
        gradient: 'from-orange-500 to-red-500'
    },
    funcional_esportivo: {
        icon: '💪',
        color: 'text-purple-400',
        gradient: 'from-purple-600 to-pink-500'
    },
    crossfit: {
        icon: '🏋️',
        color: 'text-red-400',
        gradient: 'from-red-600 to-rose-500'
    }
};

const effortZoneColors: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Recuperação' },
    2: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Aeróbico Leve' },
    3: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Aeróbico' },
    4: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Limiar' },
    5: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Máximo' }
};

function mapSportCategory(exercise: CatalogExercise): WorkoutExercise['category'] {
    if (exercise.category === 'mobilidade') return 'mobilidade';
    if (exercise.category === 'cardio') {
        if (/corrida|esteira|sprint/i.test(exercise.name)) return 'corrida';
        return 'cardio';
    }
    if (exercise.category === 'core') return 'funcional';
    if (/salto|jump|bound|plio/i.test(exercise.name)) return 'pliometria';
    if (/agility|sport|sprint|ladder/i.test(exercise.slug || exercise.name)) return 'esporte';
    return 'funcional';
}

function mapCatalogExerciseToSportWorkout(exercise: CatalogExercise): WorkoutExercise {
    return {
        id: exercise.id,
        name: exercise.name,
        category: mapSportCategory(exercise),
        targetMuscle: exercise.primary_muscle,
        notes: exercise.execution_tips || '',
        videoUrl: exercise.video_url,
        sets: [{
            method: 'simples',
            reps: exercise.category === 'cardio' ? '' : '8-12',
            load: '',
            rest: exercise.category === 'cardio' ? '30s' : '60s',
            time: exercise.category === 'cardio' ? '30s' : ''
        }]
    };
}

function selectRecommendedExercises(sport: SportType, catalog: CatalogExercise[]): WorkoutExercise[] {
    const filtered = catalog.filter((exercise) => {
        if (sport === 'futebol') {
            return ['cardio', 'core'].includes(exercise.category) || ['agachar', 'hinge'].includes(exercise.movement_pattern);
        }
        if (sport === 'tenis') {
            return ['cardio', 'core'].includes(exercise.category) || ['empurrar_horizontal', 'puxar_horizontal'].includes(exercise.movement_pattern);
        }
        if (sport === 'natacao') {
            return ['mobilidade', 'cardio', 'core'].includes(exercise.category) || ['puxar_horizontal', 'puxar_vertical'].includes(exercise.movement_pattern);
        }
        if (sport === 'corrida') {
            return ['cardio', 'core'].includes(exercise.category) || ['agachar', 'hinge'].includes(exercise.movement_pattern);
        }
        if (sport === 'crossfit') {
            return exercise.is_compound || ['cardio', 'core'].includes(exercise.category);
        }
        return ['cardio', 'core', 'mobilidade'].includes(exercise.category) || ['agachar', 'hinge', 'empurrar_horizontal', 'puxar_horizontal'].includes(exercise.movement_pattern);
    });

    return filtered.slice(0, 6).map(mapCatalogExerciseToSportWorkout);
}

const SportTrainingView: React.FC<SportTrainingViewProps> = ({ clientName = 'Aluno', onBack, onSave }) => {
    const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseCatalog, setExerciseCatalog] = useState<CatalogExercise[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(true);

    // Training params
    const [targetZone, setTargetZone] = useState<1 | 2 | 3 | 4 | 5>(3);
    const [rpe, setRpe] = useState<number>(7);
    const [useOxygenLadder, setUseOxygenLadder] = useState(false);

    // Intervals for HIIT-style training
    const [intervals, setIntervals] = useState<{ work: number; rest: number }[]>([
        { work: 30, rest: 30 }
    ]);

    useEffect(() => {
        let cancelled = false;

        const loadCatalog = async () => {
            setIsCatalogLoading(true);
            try {
                const exercises = await fetchAllExercises();
                if (!cancelled) setExerciseCatalog(exercises);
            } catch (error) {
                sportTrainingLogger.error('Error loading sport training exercise catalog', error);
                if (!cancelled) setExerciseCatalog([]);
            } finally {
                if (!cancelled) setIsCatalogLoading(false);
            }
        };

        void loadCatalog();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSelectSport = (sport: SportType) => {
        setSelectedSport(sport);
        setWorkoutTitle(`Treino ${sport.charAt(0).toUpperCase() + sport.slice(1).replace('_', ' ')}`);

        const recommended = selectRecommendedExercises(sport, exerciseCatalog);
        setSelectedExercises(recommended);
    };

    const recommendedCounts = useMemo(() => {
        return (Object.keys(sportConfig) as SportType[]).reduce<Record<SportType, number>>((acc, sport) => {
            acc[sport] = selectRecommendedExercises(sport, exerciseCatalog).length;
            return acc;
        }, {} as Record<SportType, number>);
    }, [exerciseCatalog]);

    const estimatedDurationMinutes = useMemo(() => {
        const intervalMinutes = intervals.reduce((acc, interval) => acc + interval.work + interval.rest, 0) / 60;
        const exerciseBlockMinutes = selectedExercises.length * 3;
        return Math.max(1, Math.round(intervalMinutes + exerciseBlockMinutes));
    }, [intervals, selectedExercises.length]);

    const addInterval = () => {
        setIntervals([...intervals, { work: 30, rest: 30 }]);
    };

    const removeInterval = (index: number) => {
        setIntervals(intervals.filter((_, i) => i !== index));
    };

    const updateInterval = (index: number, field: 'work' | 'rest', value: number) => {
        const newIntervals = [...intervals];
        newIntervals[index][field] = value;
        setIntervals(newIntervals);
    };

    const handleSave = () => {
        const sportParams: SportTrainingParams = {
            sport: selectedSport!,
            effortZone: targetZone,
            rpe,
            fatigue: rpe >= 8 ? 'high' : rpe >= 5 ? 'medium' : 'low',
            oxygenLadder: useOxygenLadder,
            intervals: intervals
        };

        onSave({
            title: workoutTitle,
            exercises: selectedExercises,
            sportParams,
            objective: `Treino Esportivo - ${selectedSport}`,
            duration: `${intervals.reduce((acc, i) => acc + i.work + i.rest, 0) / 60} min aprox.`
        });
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
                        <h1 className="font-black text-sm uppercase tracking-widest text-slate-400">Treino Esportivo</h1>
                        <p className="font-bold text-white text-xs flex items-center gap-1">
                            <Zap size={12} className="text-blue-400" />
                            Premium
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!selectedSport || selectedExercises.length === 0}
                        aria-label="Salvar treino esportivo"
                        className={`p-2 rounded-xl transition-all ${selectedSport && selectedExercises.length > 0 ? 'bg-blue-600 text-white shadow-glow' : 'bg-slate-800 text-slate-500'}`}
                    >
                        <Save size={20} />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto p-4 space-y-6">
                {/* Sport Selection */}
                {!selectedSport ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-black text-white">Escolha o Esporte</h2>
                        <p className="text-sm text-slate-400">
                            Selecione a modalidade para criar um treino específico com parâmetros esportivos.
                            {isCatalogLoading ? ' O catálogo real está sendo carregado.' : exerciseCatalog.length === 0 ? ' Nenhum exercício do catálogo foi encontrado.' : ' As sugestões abaixo usam o catálogo real do app.'}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(sportConfig) as SportType[]).map(sport => (
                                <motion.button
                                    key={sport}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelectSport(sport)}
                                    aria-label={`Selecionar esporte ${sport.replace('_', ' ')}`}
                                    className={`glass-card rounded-[24px] p-6 text-left hover:border-${sportConfig[sport].gradient.split('-')[1]}-500/50 transition-all group`}
                                >
                                    <span className="text-4xl mb-3 block">{sportConfig[sport].icon}</span>
                                    <h3 className="font-bold text-white capitalize">{sport.replace('_', ' ')}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                                        {isCatalogLoading
                                            ? 'Carregando sugestões...'
                                            : recommendedCounts[sport] > 0
                                                ? `${recommendedCounts[sport]} sugestões reais`
                                                : 'Sem sugestões no catálogo atual'}
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Selected Sport Header */}
                        <div className={`glass-card rounded-[24px] p-6 bg-gradient-to-br ${sportConfig[selectedSport].gradient} border-none`}>
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{sportConfig[selectedSport].icon}</span>
                                <div>
                                    <input
                                        type="text"
                                        value={workoutTitle}
                                        onChange={(e) => setWorkoutTitle(e.target.value)}
                                        className="bg-transparent text-xl font-black text-white outline-none w-full"
                                        placeholder="Título do Treino"
                                    />
                                    <p className="text-sm text-white/70 font-bold capitalize">{selectedSport.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSport(null)}
                                className="text-xs text-white/50 mt-4 hover:text-white transition-colors"
                            >
                                ← Trocar esporte
                            </button>
                        </div>

                        {/* Effort Zone Selector */}
                        <div className="glass-card rounded-[24px] p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Heart size={18} className="text-red-400" />
                                <h3 className="font-bold text-white">Zona de Esforço</h3>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map(zone => (
                                    <button
                                        key={zone}
                                        onClick={() => setTargetZone(zone as any)}
                                        className={`py-3 rounded-xl text-center transition-all ${targetZone === zone
                                                ? `${effortZoneColors[zone].bg} border-2 border-current ${effortZoneColors[zone].text}`
                                                : 'bg-slate-800/50 text-slate-500'
                                            }`}
                                    >
                                        <span className="text-lg font-black">{zone}</span>
                                    </button>
                                ))}
                            </div>
                            <p className={`text-xs font-bold text-center ${effortZoneColors[targetZone].text}`}>
                                {effortZoneColors[targetZone].label}
                            </p>
                        </div>

                        {/* RPE Slider */}
                        <div className="glass-card rounded-[24px] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity size={18} className="text-orange-400" />
                                    <h3 className="font-bold text-white">RPE (Percepção de Esforço)</h3>
                                </div>
                                <span className="text-2xl font-black text-orange-400">{rpe}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={rpe}
                                onChange={(e) => setRpe(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>Fácil</span>
                                <span>Moderado</span>
                                <span>Máximo</span>
                            </div>
                        </div>

                        {/* Intervals */}
                        <div className="glass-card rounded-[24px] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer size={18} className="text-blue-400" />
                                    <h3 className="font-bold text-white">Intervalos</h3>
                                </div>
                                <button
                                    onClick={addInterval}
                                    aria-label="Adicionar intervalo"
                                    className="size-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {intervals.map((interval, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-3">
                                        <span className="text-xs font-bold text-slate-500 w-6">{idx + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[8px] text-slate-500 font-black uppercase block mb-1">Trabalho</label>
                                                <input
                                                    type="number"
                                                    value={interval.work}
                                                    onChange={(e) => updateInterval(idx, 'work', parseInt(e.target.value) || 0)}
                                                    aria-label={`Tempo de trabalho do intervalo ${idx + 1}`}
                                                    className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-sm font-bold text-white outline-none focus:ring-1 ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] text-slate-500 font-black uppercase block mb-1">Descanso</label>
                                                <input
                                                    type="number"
                                                    value={interval.rest}
                                                    onChange={(e) => updateInterval(idx, 'rest', parseInt(e.target.value) || 0)}
                                                    aria-label={`Tempo de descanso do intervalo ${idx + 1}`}
                                                    className="w-full bg-slate-900/50 rounded-lg py-2 px-2 text-center text-sm font-bold text-white outline-none focus:ring-1 ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        {intervals.length > 1 && (
                                            <button
                                                onClick={() => removeInterval(idx)}
                                                aria-label={`Remover intervalo ${idx + 1}`}
                                                className="text-slate-600 hover:text-red-400 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-slate-500 text-center">
                                Total base de intervalos: {Math.round(intervals.reduce((acc, i) => acc + i.work + i.rest, 0) / 60)} minutos
                            </p>
                        </div>

                        {/* Oxygen Ladder Toggle */}
                        <div className="glass-card rounded-[24px] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    <TrendingUp size={20} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Escada de Oxigênio</h4>
                                    <p className="text-[10px] text-slate-500">Bloco com intensidade crescente</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseOxygenLadder(!useOxygenLadder)}
                                aria-label={useOxygenLadder ? 'Desativar escada de oxigênio' : 'Ativar escada de oxigênio'}
                                aria-pressed={useOxygenLadder}
                                className={`relative w-12 h-6 rounded-full transition-colors ${useOxygenLadder ? 'bg-cyan-500' : 'bg-slate-700'}`}
                            >
                                <motion.div
                                    animate={{ x: useOxygenLadder ? 24 : 2 }}
                                    className="absolute top-1 left-0 size-4 bg-white rounded-full shadow-md"
                                />
                            </button>
                        </div>

                        {/* Selected Exercises */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white">Exercícios ({selectedExercises.length})</h3>
                                <button
                                    onClick={() => setShowExerciseSelector(true)}
                                    aria-label="Adicionar exercício ao treino esportivo"
                                    className="text-xs font-bold text-blue-400 uppercase tracking-widest"
                                >
                                    + Adicionar
                                </button>
                            </div>

                            {selectedExercises.map((ex, idx) => (
                                <div key={ex.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                                    <span className="size-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-sm">{ex.name}</p>
                                        <p className="text-[10px] text-slate-500">{ex.targetMuscle}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedExercises(selectedExercises.filter(e => e.id !== ex.id))}
                                        aria-label={`Remover exercício ${ex.name}`}
                                        className="text-slate-600 hover:text-red-400 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            {selectedExercises.length === 0 && (
                                <div className="glass-card rounded-2xl p-4 text-center space-y-2">
                                    <p className="text-sm font-bold text-white">Nenhum exercício sugerido ainda</p>
                                    <p className="text-xs text-slate-400">
                                        {exerciseCatalog.length === 0
                                            ? 'O catálogo real não carregou exercícios para esta modalidade.'
                                            : 'Adicione exercícios manualmente para montar este treino esportivo.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Duração estimada</p>
                                <p className="text-lg font-black text-white">{estimatedDurationMinutes} min</p>
                            </div>
                            <p className="max-w-[180px] text-right text-xs text-slate-400">
                                Estimativa baseada em intervalos configurados e quantidade de exercícios selecionados.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SportTrainingView;
