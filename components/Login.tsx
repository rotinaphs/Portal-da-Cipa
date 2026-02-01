import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, Building2, AlertCircle, CheckCircle2, AlertTriangle, UserPlus, LogIn } from 'lucide-react';
import { useAppStore } from '../store';

const Login: React.FC = () => {
  const { settings } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login e Cadastro
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Normalização e Validação básica
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!normalizedEmail) {
      setErrorMsg('Por favor, informe seu e-mail.');
      setLoading(false);
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setErrorMsg('Formato de e-mail inválido. Verifique se há espaços ou caracteres incorretos.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Fluxo de Cadastro
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Cadastro iniciado com sucesso.');
      } else {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let msg = error.message || 'Ocorreu um erro na autenticação.';
      const lowerMsg = msg.toLowerCase();
      
      // Tratamento amigável de erros do Supabase/GoTrue
      if (lowerMsg.includes('invalid login credentials')) {
        msg = 'E-mail ou senha incorretos. Se este é seu primeiro acesso, clique em "Criar Conta" abaixo.';
      } else if (lowerMsg.includes('rate limit')) {
        msg = 'Muitas tentativas. Por segurança, o sistema bloqueou novos acessos temporariamente. Tente novamente em alguns minutos.';
      } else if (lowerMsg.includes('user already registered')) {
        msg = 'Este e-mail já possui cadastro ativo. Utilize a opção "Entrar no Portal".';
      } else if (lowerMsg.includes('email not confirmed')) {
        msg = 'Seu e-mail ainda não foi confirmado. Por favor, valide o link enviado para sua caixa de entrada.';
      } else if (lowerMsg.includes('network error') || lowerMsg.includes('failed to fetch')) {
        msg = 'Erro de conexão. Verifique se você está conectado à internet ou se as chaves do Supabase estão corretas.';
      }

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 animate-fadeIn">
      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2.2rem] flex items-center justify-center text-slate-900 shadow-xl shadow-slate-200 mx-auto mb-6">
            {settings.logoBase64 ? (
              <img src={settings.logoBase64} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-blue-700" />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
            {settings.portalTitle}
          </h1>
          <div className="flex items-center justify-center gap-2">
             <Building2 className="w-3.5 h-3.5 text-slate-400" />
             <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
               {settings.companyName}
             </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          {successMsg ? (
            <div className="text-center py-6 animate-fadeIn">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100 shadow-xl shadow-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Verifique seu E-mail</h2>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Um link de confirmação foi enviado para o endereço abaixo. Você precisa clicar no link para ativar seu acesso.
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-3 break-all">{email.trim()}</p>
              </div>

              <div className="flex items-start gap-3 text-left bg-amber-50 p-4 rounded-xl border border-amber-100 mb-8">
                  <div className="mt-0.5 flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                      <h4 className="text-[10px] font-black text-amber-800 uppercase mb-0.5">Não recebeu?</h4>
                      <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                          Verifique sua pasta de <strong>Spam</strong>. Caso o erro persista, tente cadastrar novamente após alguns minutos.
                      </p>
                  </div>
              </div>

              <button
                onClick={() => { setIsSignUp(false); setSuccessMsg(null); setEmail(''); setPassword(''); }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
              >
                Voltar para Login
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {isSignUp ? <UserPlus className="w-5 h-5 text-indigo-600" /> : <LogIn className="w-5 h-5 text-blue-600" />}
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {isSignUp ? 'Criar Nova Conta' : 'Acesso ao Portal'}
                </h2>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                      placeholder="seu.email@empresa.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="password"
                      required
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-600 font-bold leading-relaxed">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-50 text-center">
                 <button 
                   onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                   className="group text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                 >
                   {isSignUp ? (
                     <>Possui conta? <span className="text-blue-600 group-hover:underline">Entrar no Portal</span></>
                   ) : (
                     <>Primeiro acesso? <span className="text-blue-600 group-hover:underline">Criar Conta Agora</span></>
                   )}
                 </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-10">
          Portal Homologado &bull; NR-5 Compliance &bull; {new Date().getFullYear()}
        </p>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default Login;