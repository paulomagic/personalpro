
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface LogoLabViewProps {
  onBack: () => void;
}

const LogoLabView: React.FC<LogoLabViewProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('Personal Trainer brand identity, minimal, geometric, professional navy and silver');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('minimal');
  const stylePresets = [
    { id: 'minimal', name: 'Minimalista', icon: 'auto_awesome_mosaic', color: 'from-slate-500 to-slate-700' },
    { id: 'hardcore', name: 'Musculação', icon: 'fitness_center', color: 'from-red-600 to-red-900' },
    { id: 'wellness', name: 'Wellness', icon: 'spa', color: 'from-emerald-500 to-teal-700' },
    { id: 'modern', name: 'Moderno', icon: 'architecture', color: 'from-blue-600 to-indigo-800' },
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    // Simulação de geração ultra-premium
    setTimeout(() => {
      setGeneratedImage('https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&h=800&fit=crop');
      setLoading(false);
    }, 5000);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 pb-12">
      <header className="px-6 pt-14 pb-8 flex justify-between items-center animate-fade-in">
        <button
          onClick={onBack}
          className="size-12 rounded-2xl glass-card flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-tight">Brand Lab</h2>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Identidade Visual IA</p>
        </div>
        <div className="size-12"></div>
      </header>

      <main className="px-6 space-y-8">
        {/* Style Presets */}
        <section className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-indigo-400 text-xl">palette</span>
            <h3 className="font-black text-white tracking-tight">Presets de DNA</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stylePresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSelectedStyle(preset.id)}
                className={`p-4 rounded-3xl flex flex-col items-center gap-3 transition-all duration-300 ${selectedStyle === preset.id
                  ? 'glass-card border-blue-500/50 bg-blue-500/10 shadow-glow scale-105'
                  : 'glass-card opacity-50 hover:opacity-100'
                  }`}
              >
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${preset.color} flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-white">{preset.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{preset.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Input Area */}
        <section className="animate-slide-up stagger-1">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-blue-400 text-xl">psychology</span>
            <h3 className="font-black text-white tracking-tight">Descreva seu Posicionamento</h3>
          </div>
          <div className="glass-card rounded-[32px] p-5 shadow-inner">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Quero uma marca elegante, focada em mulheres que buscam alta performance..."
              className="w-full bg-transparent text-white placeholder:text-slate-500 text-sm outline-none min-h-[140px] resize-none font-medium leading-relaxed"
            />
          </div>
        </section>

        {/* Action & Result */}
        <section className="animate-slide-up stagger-2">
          {loading ? (
            <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center gap-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent animate-shimmer"></div>
              <div className="size-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">Gerando Branding Elite...</p>
            </div>
          ) : generatedImage ? (
            <div className="space-y-6">
              <div className="glass-card rounded-[40px] p-2 aspect-square relative group overflow-hidden">
                <img src={generatedImage} className="w-full h-full object-cover rounded-[32px]" alt="Generated Brand" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button className="size-14 rounded-2xl bg-white text-slate-950 flex items-center justify-center shadow-xl active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-3xl">download</span>
                  </button>
                  <button className="size-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-3xl">share</span>
                  </button>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="w-full h-16 glass-card border-white/5 text-white font-black rounded-3xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">restart_alt</span>
                Tentar Outro Estilo
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!prompt}
              className="w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black rounded-[32px] flex items-center justify-center gap-4 shadow-xl shadow-blue-900/40 disabled:opacity-30 disabled:grayscale transition-all uppercase tracking-[0.2em]"
            >
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              Criar Identidade Visual
            </button>
          )}
        </section>
      </main>
    </div>
  );
};

export default LogoLabView;
