import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    RefreshCw,
    MessageSquare
} from 'lucide-react';
import { getPendingRescheduleRequests, respondToRescheduleRequest, DBRescheduleRequest } from '../services/supabaseClient';

interface PendingRequestsPanelProps {
    coachId: string;
    onUpdate?: () => void;  // Callback to refresh parent state
}

const PendingRequestsPanel: React.FC<PendingRequestsPanelProps> = ({ coachId, onUpdate }) => {
    const [requests, setRequests] = useState<(DBRescheduleRequest & { client_name?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, [coachId]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getPendingRescheduleRequests(coachId);
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId: string, approved: boolean) => {
        setResponding(requestId);
        try {
            const success = await respondToRescheduleRequest(requestId, approved);
            if (success) {
                // Remove from list
                setRequests(prev => prev.filter(r => r.id !== requestId));
                // Notify parent to update badge
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Error responding to request:', error);
        } finally {
            setResponding(null);
        }
    };

    const formatDate = (dateStr: string) => {
        // Parse ISO date string without timezone conversion
        // Format: "2026-01-09T18:00:00.000Z" or "2026-01-09T18:00:00"
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const time = timePart ? timePart.slice(0, 5) : '00:00'; // Get HH:MM

        // Create date for formatting weekday/month only
        const date = new Date(year, month - 1, day);
        const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

        return `${weekday}, ${day} de ${monthName}, ${time}`;
    };

    if (loading) {
        return null;
    }

    if (requests.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-blue-500/30 rounded-2xl"
            >
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <RefreshCw size={20} className="text-blue-400" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-white">
                            {requests.length} Solicitação{requests.length > 1 ? 'ões' : ''} de Reagendamento
                        </p>
                        <p className="text-xs text-amber-300">
                            Clique para {expanded ? 'recolher' : 'expandir'}
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp size={20} className="text-blue-400" />
                ) : (
                    <ChevronDown size={20} className="text-blue-400" />
                )}
            </button>

            {/* Requests List */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 mt-3">
                            {requests.map((request) => (
                                <motion.div
                                    key={request.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl"
                                >
                                    {/* Client Name */}
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-bold text-white text-lg">
                                            {request.client_name || 'Aluno'}
                                        </p>
                                        <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                            Pendente
                                        </span>
                                    </div>

                                    {/* Date Change */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1 p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-[10px] font-bold text-red-400 uppercase">De</p>
                                            <p className="text-sm text-white font-medium">
                                                {formatDate(request.original_date)}
                                            </p>
                                        </div>
                                        <span className="text-slate-500">→</span>
                                        <div className="flex-1 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase">Para</p>
                                            <p className="text-sm text-white font-medium">
                                                {formatDate(request.requested_date)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {request.reason && (
                                        <div className="mb-3 p-2 bg-slate-700/50 rounded-xl flex items-start gap-2">
                                            <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-slate-300">{request.reason}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRespond(request.id, false)}
                                            disabled={responding === request.id}
                                            className="flex-1 py-2 px-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                        >
                                            <X size={16} />
                                            Rejeitar
                                        </button>
                                        <button
                                            onClick={() => handleRespond(request.id, true)}
                                            disabled={responding === request.id}
                                            className="flex-1 py-2 px-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                        >
                                            <Check size={16} />
                                            {responding === request.id ? 'Processando...' : 'Aprovar'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PendingRequestsPanel;
