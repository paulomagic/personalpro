
import { NativeTurnstile } from '../components/NativeTurnstile';
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { validateTurnstileToken } from '../services/turnstileService';

interface LoginViewProps {
  onLogin: (user: any) => void;
}

const InputField = ({ type, placeholder, value, onChange }: any) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full h-14 px-6 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
  />
);

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Rate limiting states
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  const slides = [
    {
      title: "Performance de Elite",
      subtitle: "A plataforma definitiva para personal trainers que buscam resultados extraordinários."
    },
    {
      title: "Inteligência Artificial",
      subtitle: "Gere protocolos personalizados em segundos e monitore a evolução com precisão."
    },
    {
      title: "Gestão Exclusiva",
      subtitle: "Organize sua agenda, financeiro e métricas em um único lugar."
    }
  ];

  const handleLogin = async () => {
    // Check if user is locked out
    if (lockUntil && Date.now() < lockUntil) {
      const remainingSeconds = Math.ceil((lockUntil - Date.now()) / 1000);
      setError(`Muitas tentativas. Aguarde ${remainingSeconds}s`);
      return;
    }

    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    if (!captchaToken) {
      setError('Por favor, complete a verificação de segurança');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate CAPTCHA server-side first
      const captchaValidation = await validateTurnstileToken(captchaToken);
      if (!captchaValidation.success) {
        setError(captchaValidation.error || 'Falha na validação de segurança');
        setLoading(false);
        return;
      }

      if (!supabase) {
        onLogin({ email, demo: true });
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Increment failed attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Lock after 5 failed attempts with exponential backoff
        if (newAttempts >= 5) {
          const lockDuration = 30000 * Math.pow(2, newAttempts - 5); // 30s, 60s, 120s...
          setLockUntil(Date.now() + lockDuration);
          setError(`Conta bloqueada por ${lockDuration / 1000}s após ${newAttempts} tentativas`);
        } else {
          setError(authError.message === 'Invalid login credentials'
            ? `Email ou senha incorretos (${5 - newAttempts} tentativas restantes)`
            : authError.message);
        }
        return;
      }

      // Reset on successful login
      setLoginAttempts(0);
      setLockUntil(null);
      if (data.user) onLogin(data.user);
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

    if (!captchaToken) {
      setError('Por favor, complete a verificação de segurança');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate CAPTCHA server-side first
      const captchaValidation = await validateTurnstileToken(captchaToken);
      if (!captchaValidation.success) {
        setError(captchaValidation.error || 'Falha na validação de segurança');
        setLoading(false);
        return;
      }

      if (!supabase) {
        onLogin({ email, name, demo: true });
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
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

  const handleDemoLogin = () => {
    onLogin({ email: 'demo@personalpro.com', name: 'Rodrigo Campanato', demo: true });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        setError('Supabase não configurado');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError('Erro ao conectar com Google');
      setLoading(false);
    }
  };

  // Check for session on mount (handle OAuth redirect)
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          onLogin(session.user);
        }
      });
    }
  }, []);

  // Auth Form (Shared for Login/Register)
  if (showLogin || showRegister) {
    const isRegister = showRegister;
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 px-8 py-12">
        <button
          onClick={() => { setShowLogin(false); setShowRegister(false); setError(null); }}
          className="absolute top-12 left-6 size-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="pt-12 pb-8 flex justify-center">
          <div className="size-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <span className="material-symbols-outlined text-white text-2xl">fitness_center</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
          {isRegister ? 'Criar Conta' : 'Bem-vindo'}
        </h1>
        <p className="text-slate-400 text-center mb-8 font-medium">
          {isRegister ? 'Inicie sua jornada ultra-premium' : 'Acesse sua conta para continuar'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-4 animate-slide-up">
          {isRegister && (
            <InputField type="text" placeholder="Nome completo" value={name} onChange={(e: any) => setName(e.target.value)} />
          )}
          <InputField type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <div className="relative">
            <InputField type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e: any) => setPassword(e.target.value)} />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          <NativeTurnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
            onSuccess={(token) => {
              setCaptchaToken(token);
              setError(null);
            }}
            onError={(error) => {
              console.error('Turnstile error:', error);
              setError('Erro na verificação de segurança. Recarregue a página.');
            }}
            onExpire={() => {
              setCaptchaToken(null);
              setError('Verificação expirou. Complete novamente.');
            }}
            theme="dark"
          />
        </div>

        <button
          onClick={isRegister ? handleRegister : handleLogin}
          disabled={loading}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center border border-white/5 mb-4"
        >
          {loading ? (
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            isRegister ? 'Começar Agora' : 'Entrar'
          )}
        </button>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98] font-bold rounded-2xl text-base transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Entrar com Google</span>
        </button>

        <p className="text-center mt-6 text-sm text-slate-500">
          {isRegister ? 'Já tem uma conta?' : 'Não tem conta?'}
          <button onClick={() => { setShowLogin(!isRegister); setShowRegister(!showRegister); setError(null); }} className="text-blue-500 font-bold ml-1 hover:underline">
            {isRegister ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    );
  }

  // Onboarding (Introduction)
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <div className="pt-14 pb-6 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">fitness_center</span>
          </div>
          <span className="font-black text-xl tracking-tight text-white">Apex Ultra</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 animate-fade-in py-8">
        <div className="w-full max-w-sm aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 border border-white/10 bg-slate-900 relative group">
          <img
            src="/hero.png"
            alt="Athlete"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        </div>
      </div>

      <div className="px-8 pb-8 pt-4 relative z-10">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-black text-white leading-tight tracking-tight mb-3">
            {slides[currentSlide].title}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto font-medium">
            {slides[currentSlide].subtitle}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8 animate-fade-in">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                ? 'w-8 bg-blue-600 shadow-glow'
                : 'w-2 bg-slate-800'
                }`}
            />
          ))}
        </div>

        <div className="space-y-3 animate-slide-up stagger-2">
          <button
            onClick={() => setShowRegister(true)}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-blue-600/20 uppercase tracking-wider border border-white/5"
          >
            Começar Grátis
          </button>

          {/* Google Login Button (Onboarding) */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98] font-bold rounded-2xl text-sm transition-all shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            <span>Entrar com Google</span>
          </button>

          <button
            onClick={handleDemoLogin}
            className="w-full h-14 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white font-bold rounded-2xl text-sm transition-all border border-white/10 uppercase tracking-wider"
          >
            Modo Demonstração
          </button>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500">
          Já tem uma conta? <button onClick={() => setShowLogin(true)} className="text-blue-500 font-bold hover:underline">Entrar</button>
        </p>
      </div>
    </div>
  );
};

export default LoginView;
