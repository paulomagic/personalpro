
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginViewProps {
  onLogin: (user: any) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const slides = [
    {
      title: "Performance de Elite",
      subtitle: "A plataforma definitiva para personal trainers que buscam resultados extraordinários para seus alunos."
    },
    {
      title: "Inteligência Artificial",
      subtitle: "Gere protocolos personalizados em segundos e monitore a evolução com precisão cirúrgica."
    },
    {
      title: "Gestão Exclusiva",
      subtitle: "Organize sua agenda, financeiro e métricas em um único lugar, com elegância e simplicidade."
    }
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        // Demo mode - skip auth
        onLogin({ email, demo: true });
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : authError.message);
        return;
      }

      if (data.user) {
        onLogin(data.user);
      }
    } catch (err: any) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        // Demo mode - skip auth
        onLogin({ email, name, demo: true });
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email já está cadastrado');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          setError('Este email já está cadastrado');
          return;
        }

        // If email confirmation is enabled, show message
        if (!data.session) {
          setError('Verifique seu email para confirmar o cadastro');
          return;
        }

        onLogin(data.user);
      }
    } catch (err: any) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Modo demo - login social indisponível');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Erro ao fazer login com Google');
    }
  };

  const handleDemoLogin = () => {
    onLogin({ email: 'demo@personalpro.com', name: 'Rodrigo Campanato', demo: true });
  };

  // Register Form
  if (showRegister) {
    return (
      <div className="flex flex-col min-h-screen bg-white px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => { setShowRegister(false); setError(null); }}
          className="absolute top-12 left-6 size-10 rounded-full glass-card flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>

        {/* Logo */}
        <div className="pt-12 pb-8 flex justify-center">
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16C12 9.373 17.373 4 24 4C30.627 4 36 9.373 36 16C36 22.627 30.627 28 24 28" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M36 16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">Criar Conta</h1>
        <p className="text-slate-400 text-center mb-8 font-medium">Inicie sua jornada ultra-premium</p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-8 animate-slide-up">
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 px-6 rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 px-6 rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 px-6 pr-12 rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] text-white font-black rounded-2xl text-base transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest"
        >
          {loading ? (
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Criar Conta Agora'
          )}
        </button>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-slate-400">
          Já tem uma conta? <button onClick={() => { setShowRegister(false); setShowLogin(true); setError(null); }} className="text-blue-600 font-semibold hover:underline">Entrar</button>
        </p>

        <div className="flex-grow"></div>
        <p className="text-center text-[10px] text-slate-300 font-medium tracking-widest uppercase pt-8">
          PersonalPro
        </p>
      </div>
    );
  }

  // Login Form
  if (showLogin) {
    return (
      <div className="flex flex-col min-h-screen bg-white px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => { setShowLogin(false); setError(null); }}
          className="absolute top-12 left-6 size-10 rounded-full bg-slate-50 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>

        {/* Logo */}
        <div className="pt-12 pb-8 flex justify-center">
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16C12 9.373 17.373 4 24 4C30.627 4 36 9.373 36 16C36 22.627 30.627 28 24 28" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M36 16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-10 tracking-tight">Bem-vindo ao Elite</h1>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 px-6 rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 px-6 pr-12 rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        <button className="text-right text-sm text-slate-500 mb-6">Esqueci minha senha</button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-2xl text-base transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Entrar'
          )}
        </button>

        {/* Divider */}
        <div className="relative py-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-950 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ou</span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-200 active:scale-[0.98] transition-all shadow-lg text-sm uppercase tracking-wider"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </button>

          <button
            onClick={handleDemoLogin}
            className="w-full h-14 bg-white/5 border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            Explorar Demonstração
          </button>
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-sm text-slate-400">
          Não tem conta? <button onClick={() => { setShowLogin(false); setShowRegister(true); setError(null); }} className="text-blue-600 font-semibold hover:underline">Criar conta</button>
        </p>

        <div className="flex-grow"></div>
        <p className="text-center text-[10px] text-slate-300 font-medium tracking-widest uppercase pt-8">
          PersonalPro
        </p>
      </div>
    );
  }

  // Onboarding
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Logo */}
      <div className="pt-14 pb-6 flex justify-center">
        <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16C12 9.373 17.373 4 24 4C30.627 4 36 9.373 36 16C36 22.627 30.627 28 24 28" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M36 16C36 22.627 30.627 28 24 28C17.373 28 12 22.627 12 16" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Hero Image */}
      <div className="flex-1 flex items-center justify-center px-6 animate-fade-in">
        <div className="w-full max-w-sm aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl shadow-blue-900/40 border border-white/5 relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
          <img
            src="/hero.png"
            alt="Athlete"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-8 pt-6 relative z-10">
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-[40px] font-black text-white leading-[0.9] tracking-tighter mb-4">
            {slides[currentSlide].title}
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-[280px] mx-auto font-medium">
            {slides[currentSlide].subtitle}
          </p>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mb-10 animate-fade-in">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide
                ? 'w-10 bg-blue-500 shadow-glow'
                : 'w-4 bg-white/10 hover:bg-white/20'
                }`}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 animate-slide-up stagger-2">
          <button
            onClick={() => setShowRegister(true)}
            className="w-full h-16 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black rounded-2xl text-base transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            Começar Grátis
          </button>

          <button
            onClick={handleDemoLogin}
            className="w-full h-16 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-black rounded-2xl text-base transition-all flex items-center justify-center gap-2 border border-white/5 uppercase tracking-widest"
          >
            Modo Demonstração
          </button>
        </div>

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
