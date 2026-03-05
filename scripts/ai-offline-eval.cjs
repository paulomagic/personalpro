#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ai-offline-eval] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
    process.exit(1);
}

const REST_BASE = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;

function fnv1aHash(input) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36).toUpperCase();
}

function anonId(prefix, value) {
    if (!value) return `${prefix}_UNKNOWN`;
    return `${prefix}_${fnv1aHash(String(value)).slice(0, 10)}`;
}

function pct(value, total) {
    if (!total) return 0;
    return Number(((value / total) * 100).toFixed(2));
}

function avg(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values) {
    if (values.length < 2) return 0;
    const mean = avg(values);
    const variance = avg(values.map((value) => (value - mean) ** 2));
    return Math.sqrt(variance);
}

function resolveSegment(profile) {
    if (!profile) return 'unknown';
    if ((profile.age || 0) >= 55) return 'longevity';
    if ((profile.adherence || 0) < 55) return 'consistency_rebuild';
    if ((profile.level || '').toLowerCase().includes('iniciante')) return 'novice_rebuild';
    if ((profile.goal || '').toLowerCase().includes('força')) return 'strength';
    if ((profile.goal || '').toLowerCase().includes('hipertrof')) return 'hypertrophy';
    return 'general';
}

async function fetchRest(resource, query) {
    const url = `${REST_BASE}/${resource}?${query}`;
    const response = await fetch(url, {
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Accept: 'application/json'
        }
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`[ai-offline-eval] ${resource} request failed: ${response.status} ${text}`);
    }
    return response.json();
}

async function run() {
    const [feedbackRows, clientRows] = await Promise.all([
        fetchRest('workout_session_feedback', 'select=student_id,exercise_id,session_date,load_used,rpe,rir,notes&order=session_date.asc'),
        fetchRest('clients', 'select=id,goal,level,age,adherence,status')
    ]);

    const clientsById = new Map(clientRows.map((row) => [row.id, row]));
    const anonymized = feedbackRows.map((row) => {
        const profile = clientsById.get(row.student_id) || null;
        return {
            student: anonId('STU', row.student_id),
            exercise: anonId('EX', row.exercise_id),
            date: row.session_date,
            load_used: typeof row.load_used === 'number' ? row.load_used : null,
            rpe: typeof row.rpe === 'number' ? row.rpe : null,
            rir: typeof row.rir === 'number' ? row.rir : null,
            has_pain_signal: typeof row.notes === 'string' && /(dor|pain|les[aã]o|inc[oô]modo)/i.test(row.notes),
            segment: resolveSegment(profile)
        };
    });

    const validRpe = anonymized.filter((row) => typeof row.rpe === 'number').map((row) => row.rpe);
    const validRir = anonymized.filter((row) => typeof row.rir === 'number').map((row) => row.rir);
    const withLoad = anonymized.filter((row) => typeof row.load_used === 'number');
    const painSignals = anonymized.filter((row) => row.has_pain_signal).length;

    const bySegment = {};
    for (const row of anonymized) {
        if (!bySegment[row.segment]) {
            bySegment[row.segment] = { samples: 0, painSignals: 0, rpe: [], rir: [] };
        }
        bySegment[row.segment].samples += 1;
        if (row.has_pain_signal) bySegment[row.segment].painSignals += 1;
        if (typeof row.rpe === 'number') bySegment[row.segment].rpe.push(row.rpe);
        if (typeof row.rir === 'number') bySegment[row.segment].rir.push(row.rir);
    }

    const segmentMetrics = Object.fromEntries(
        Object.entries(bySegment).map(([segment, data]) => [
            segment,
            {
                samples: data.samples,
                painRatePct: pct(data.painSignals, data.samples),
                avgRpe: Number(avg(data.rpe).toFixed(2)),
                avgRir: Number(avg(data.rir).toFixed(2)),
                rpeStdDev: Number(stdDev(data.rpe).toFixed(2)),
                rirStdDev: Number(stdDev(data.rir).toFixed(2))
            }
        ])
    );

    const report = {
        generatedAt: new Date().toISOString(),
        source: {
            feedbackRows: feedbackRows.length,
            clientRows: clientRows.length
        },
        quality: {
            sampleSize: anonymized.length,
            uniqueStudents: new Set(anonymized.map((row) => row.student)).size,
            uniqueExercises: new Set(anonymized.map((row) => row.exercise)).size,
            painSignalRatePct: pct(painSignals, anonymized.length),
            avgRpe: Number(avg(validRpe).toFixed(2)),
            avgRir: Number(avg(validRir).toFixed(2)),
            avgLoad: Number(avg(withLoad.map((row) => row.load_used)).toFixed(2))
        },
        bySegment: segmentMetrics,
        notes: [
            'Dataset anonimizado com hash FNV-1a.',
            'Sinais de dor detectados por heurística textual em notes.',
            'Use este relatório para calibrar guardrails de progressão e políticas por segmento.'
        ]
    };

    const reportsDir = path.resolve(process.cwd(), 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const fileName = `ai-offline-eval-${new Date().toISOString().slice(0, 10)}.json`;
    const reportPath = path.join(reportsDir, fileName);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`[ai-offline-eval] OK: ${reportPath}`);
    console.log(`[ai-offline-eval] Samples=${report.quality.sampleSize} Students=${report.quality.uniqueStudents}`);
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
