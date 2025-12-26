
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface LogoLabViewProps {
  onBack: () => void;
}

const LogoLabView: React.FC<LogoLabViewProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('Personal Trainer brand identity, minimal, geometric, professional navy and silver');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateLogo = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `Create a professional elite B2B brand identity for a high-end personal trainer. Brand name is Apex. Theme: ${prompt}. Minimalist, ultra-clean, architectural, luxury fitness aesthetic, studio lighting, vector style.` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <header className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-900 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <button onClick={onBack} className="size-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100">
           <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Apex Brand Lab</h2>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
        <div className="space-y-2">
          <h3 className="text-[28px] font-black tracking-tighter leading-tight">Construa sua<br/>Autoridade Visual.</h3>
          <p className="text-sm text-slate-500 font-medium">Use a Inteligência Criativa Apex para materializar seu posicionamento de mercado.</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
          <label className="block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">DNA da Marca</span>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 block w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 min-h-[120px] font-medium text-sm focus:ring-slate-900 focus:border-slate-900 transition-all"
              placeholder="Descreva a essência do seu serviço (ex: Performance de Elite, Minimalista, Científico...)"
            />
          </label>
          
          <button 
            onClick={generateLogo}
            disabled={loading}
            className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">design_services</span>
                Renderizar Identidade
              </>
            )}
          </button>
        </div>

        {generatedImage && (
          <div className="animate-in zoom-in-95 duration-500 space-y-4">
             <div className="aspect-square w-full rounded-[24px] overflow-hidden shadow-2xl border-4 border-slate-50 dark:border-slate-800">
                <img src={generatedImage} alt="Apex Generated Identity" className="w-full h-full object-cover" />
             </div>
             <button className="w-full h-14 bg-slate-100 dark:bg-white dark:text-slate-900 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 border border-slate-200">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Exportar Assets Pro
             </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LogoLabView;
