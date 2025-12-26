
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const slides = [
    {
      title: "Redefina Seus Limites",
      subtitle: "Experimente uma nova era de fitness projetada para longevidade, força e paz interior."
    },
    {
      title: "Treine com Inteligência",
      subtitle: "IA que entende seu corpo e otimiza cada treino para resultados extraordinários."
    },
    {
      title: "Evolução Constante",
      subtitle: "Acompanhe seu progresso e celebre cada conquista na sua jornada fitness."
    }
  ];

  if (showLogin) {
    return (
      <div className="flex flex-col min-h-screen bg-white px-8 py-12">
        {/* Logo */}
        <div className="pt-12 pb-8 flex justify-center">
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16C12 9.373 17.373 4 24 4C30.627 4 36 9.373 36 16C36 22.627 30.627 28 24 28" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M36 16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <h1 className="text-[28px] font-bold text-slate-900 text-center mb-12">Bem-vindo de volta</h1>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
          />
          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              className="w-full h-14 px-5 pr-12 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-xl">visibility_off</span>
            </button>
          </div>
        </div>

        <button className="text-right text-sm text-slate-500 mb-8">Esqueci senha</button>

        <button
          onClick={onLogin}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-2xl text-base transition-all shadow-lg shadow-blue-600/25"
        >
          Entrar
        </button>

        {/* Divider */}
        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm text-slate-400">ou</span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          <button className="w-full h-14 bg-white border border-slate-200 text-slate-900 font-medium rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor" />
            </svg>
            Continuar com Apple
          </button>
          <button className="w-full h-14 bg-white border border-slate-200 text-slate-900 font-medium rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </button>
        </div>

        <div className="flex-grow"></div>
        <p className="text-center text-[10px] text-slate-300 font-medium tracking-widest uppercase pt-8">
          Premium Fitness
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Logo */}
      <div className="pt-14 pb-6 flex justify-center">
        <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16C12 9.373 17.373 4 24 4C30.627 4 36 9.373 36 16C36 22.627 30.627 28 24 28" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M36 16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Hero Image */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20">
          <img
            src="/hero.png"
            alt="Athlete"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-8 pt-6">
        <div className="text-center mb-6">
          <h1 className="text-[32px] font-bold text-slate-900 leading-tight tracking-tight mb-3">
            {slides[currentSlide].title}
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-xs mx-auto">
            {slides[currentSlide].subtitle}
          </p>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                ? 'w-6 bg-blue-600'
                : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onLogin}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-2xl text-base transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
        >
          Comece Sua Jornada
        </button>

        {/* Login Link */}
        <p className="text-center mt-5 text-sm text-slate-400">
          Já tem uma conta? <button onClick={() => setShowLogin(true)} className="text-blue-600 font-semibold hover:underline">Entrar</button>
        </p>
      </div>

      {/* Footer */}
      <div className="pb-6">
        <p className="text-center text-[10px] text-slate-300 font-medium tracking-widest uppercase">
          PersonalPro
        </p>
      </div>
    </div>
  );
};

export default LoginView;
