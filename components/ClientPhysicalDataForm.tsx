import React, { useState, useEffect } from 'react';
import { Cake, Weight, Ruler, Activity } from 'lucide-react';

interface ClientPhysicalData {
    age?: number;
    weight?: number;
    height?: number;
}

interface Props {
    age?: number;
    weight?: number;
    height?: number;
    onUpdate: (data: ClientPhysicalData) => void;
    compact?: boolean;
    readOnly?: boolean;
}

export function ClientPhysicalDataForm({
    age,
    weight,
    height,
    onUpdate,
    compact = false,
    readOnly = false
}: Props) {
    const [localAge, setLocalAge] = useState(age?.toString() || '');
    const [localWeight, setLocalWeight] = useState(weight?.toString() || '');
    const [localHeight, setLocalHeight] = useState(height?.toString() || '');

    // Calcula IMC automaticamente
    const calculateBMI = (): number | null => {
        const w = parseFloat(localWeight);
        const h = parseFloat(localHeight);
        if (w > 0 && h > 0) {
            return w / ((h / 100) ** 2);
        }
        return null;
    };

    const getBMIClassification = (bmi: number): { label: string; color: string } => {
        // Tabela OMS atualizada
        if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-yellow-400' };
        if (bmi < 25) return { label: 'Normal', color: 'text-green-400' };
        if (bmi < 30) return { label: 'Sobrepeso', color: 'text-orange-400' };
        if (bmi < 35) return { label: 'Obesidade Grau I', color: 'text-red-400' };
        if (bmi < 40) return { label: 'Obesidade Grau II', color: 'text-red-500' };
        return { label: 'Obesidade Grau III', color: 'text-red-600' };
    };

    const handleUpdate = () => {
        const data: ClientPhysicalData = {
            age: localAge ? parseInt(localAge) : undefined,
            weight: localWeight ? parseFloat(localWeight) : undefined,
            height: localHeight ? parseFloat(localHeight) : undefined,
        };
        onUpdate(data);
    };

    // Atualiza quando props mudam
    useEffect(() => {
        setLocalAge(age?.toString() || '');
    }, [age]);

    useEffect(() => {
        setLocalWeight(weight?.toString() || '');
    }, [weight]);

    useEffect(() => {
        setLocalHeight(height?.toString() || '');
    }, [height]);

    const bmi = calculateBMI();
    const bmiClass = bmi ? getBMIClassification(bmi) : null;

    // Classes de input com cores corretas (fundo escuro, texto claro)
    const inputClasses = `
        w-full 
        bg-slate-800 
        border border-slate-700 
        rounded-lg 
        px-4 py-3 
        text-slate-100 
        placeholder-slate-500 
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500/50 
        focus:border-blue-500/50
        disabled:opacity-50 
        disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim();

    if (compact) {
        return (
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-medium text-slate-300">Dados Físicos</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                            <Cake className="w-3 h-3" />
                            Idade
                        </label>
                        <input
                            type="number"
                            value={localAge}
                            onChange={(e) => setLocalAge(e.target.value)}
                            onBlur={handleUpdate}
                            placeholder="Anos"
                            min="1"
                            max="120"
                            disabled={readOnly}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                            <Weight className="w-3 h-3" />
                            Peso
                        </label>
                        <input
                            type="number"
                            value={localWeight}
                            onChange={(e) => setLocalWeight(e.target.value)}
                            onBlur={handleUpdate}
                            placeholder="Kg"
                            min="20"
                            max="500"
                            step="0.1"
                            disabled={readOnly}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                            <Ruler className="w-3 h-3" />
                            Altura
                        </label>
                        <input
                            type="number"
                            value={localHeight}
                            onChange={(e) => setLocalHeight(e.target.value)}
                            onBlur={handleUpdate}
                            placeholder="Cm"
                            min="50"
                            max="250"
                            step="0.1"
                            disabled={readOnly}
                            className={inputClasses}
                        />
                    </div>
                </div>

                {bmi && bmiClass && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">IMC:</span>
                            <span className={`font-medium ${bmiClass.color}`}>
                                {bmi.toFixed(1)} - {bmiClass.label}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Versão completa (para perfil do cliente)
    return (
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Dados Físicos</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                        <Cake className="w-4 h-4" />
                        Idade (anos)
                    </label>
                    <input
                        type="number"
                        value={localAge}
                        onChange={(e) => setLocalAge(e.target.value)}
                        onBlur={handleUpdate}
                        placeholder="Ex: 38"
                        min="1"
                        max="120"
                        disabled={readOnly}
                        className={inputClasses}
                    />
                </div>

                <div>
                    <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                        <Weight className="w-4 h-4" />
                        Peso (kg)
                    </label>
                    <input
                        type="number"
                        value={localWeight}
                        onChange={(e) => setLocalWeight(e.target.value)}
                        onBlur={handleUpdate}
                        placeholder="Ex: 85.5"
                        min="20"
                        max="500"
                        step="0.1"
                        disabled={readOnly}
                        className={inputClasses}
                    />
                </div>

                <div>
                    <label className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                        <Ruler className="w-4 h-4" />
                        Altura (cm)
                    </label>
                    <input
                        type="number"
                        value={localHeight}
                        onChange={(e) => setLocalHeight(e.target.value)}
                        onBlur={handleUpdate}
                        placeholder="Ex: 178"
                        min="50"
                        max="250"
                        step="0.1"
                        disabled={readOnly}
                        className={inputClasses}
                    />
                </div>
            </div>

            {bmi && bmiClass && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Índice de Massa Corporal (IMC):</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">{bmi.toFixed(1)}</span>
                            <span className={`text-sm font-medium ${bmiClass.color}`}>
                                {bmiClass.label}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
