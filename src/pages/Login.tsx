import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export const Login: React.FC = () => {
    const { signIn, session, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { toasts, addToast, removeToast } = useToast();

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && session) {
            navigate(from, { replace: true });
        }
    }, [session, authLoading, navigate, from]);

    const validate = (): boolean => {
        const errs: { email?: string; password?: string } = {};
        if (!email) {
            errs.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'E-mail inválido';
        }
        if (!password) {
            errs.password = 'Senha é obrigatória';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            addToast('E-mail ou senha incorretos. Tente novamente.', 'error');
        } else {
            navigate(from, { replace: true });
        }
    };

    const clearError = (field: keyof typeof errors) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Hexagon className="text-brand-600 fill-brand-600" size={28} />
                        <span className="text-xl font-bold text-zinc-900 tracking-tight">MajorLeads</span>
                    </div>

                    {/* Header */}
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Bem-vindo de volta 👋</h1>
                        <p className="text-zinc-500 text-sm">Entre na sua conta para continuar</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                                />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${errors.email
                                        ? 'border-red-400 focus:border-red-400'
                                        : 'border-zinc-300 focus:border-brand-500'
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-zinc-700">Senha</label>
                                <Link
                                    to="/recuperar-senha"
                                    className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                                >
                                    Esqueci minha senha →
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                                />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${errors.password
                                        ? 'border-red-400 focus:border-red-400'
                                        : 'border-zinc-300 focus:border-brand-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-zinc-500 mt-6">
                        Não tem conta?{' '}
                        <Link to="/cadastro" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                            Criar conta gratuita
                        </Link>
                    </p>
                </div>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
