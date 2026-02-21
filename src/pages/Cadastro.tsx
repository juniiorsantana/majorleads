import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export const Cadastro: React.FC = () => {
    const { signUp, session, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { toasts, addToast, removeToast } = useToast();

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && session) {
            navigate('/onboarding', { replace: true });
        }
    }, [session, authLoading, navigate]);

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Nome é obrigatório';
        if (!email) {
            errs.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errs.email = 'E-mail inválido';
        }
        if (!password) {
            errs.password = 'Senha é obrigatória';
        } else if (password.length < 8) {
            errs.password = 'A senha deve ter pelo menos 8 caracteres';
        }
        if (!confirmPassword) {
            errs.confirmPassword = 'Confirme sua senha';
        } else if (password !== confirmPassword) {
            errs.confirmPassword = 'As senhas não coincidem';
        }
        if (!agreed) {
            errs.agreed = 'Você precisa aceitar os termos para continuar';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const { error } = await signUp(email, password, { full_name: name });
        setLoading(false);

        if (error) {
            if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already in use') || error.message.toLowerCase().includes('user already exists')) {
                addToast('Este e-mail já está em uso. Tente fazer login.', 'error');
            } else {
                addToast(error.message, 'error');
            }
        } else {
            navigate('/onboarding', { replace: true });
        }
    };

    const clearError = (field: string) => {
        if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Hexagon className="text-brand-600 fill-brand-600" size={28} />
                        <span className="text-xl font-bold text-zinc-900 tracking-tight">MajorLeads</span>
                    </div>

                    {/* Header */}
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Crie sua conta grátis 🚀</h1>
                        <p className="text-zinc-500 text-sm">14 dias grátis, sem cartão de crédito</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome completo</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type="text"
                                    autoComplete="name"
                                    placeholder="João Silva"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); clearError('name'); }}
                                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${errors.name ? 'border-red-400 focus:border-red-400' : 'border-zinc-300 focus:border-brand-500'}`}
                                />
                            </div>
                            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">E-mail</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-zinc-300 focus:border-brand-500'}`}
                                />
                            </div>
                            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Senha</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${errors.password ? 'border-red-400 focus:border-red-400' : 'border-zinc-300 focus:border-brand-500'}`}
                                />
                                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirmar senha</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${errors.confirmPassword ? 'border-red-400 focus:border-red-400' : 'border-zinc-300 focus:border-brand-500'}`}
                                />
                                <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
                        </div>

                        {/* Terms Checkbox */}
                        <div>
                            <label className={`flex items-start gap-3 cursor-pointer group`}>
                                <div className="relative mt-0.5 shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => { setAgreed(e.target.checked); clearError('agreed'); }}
                                        className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-brand-600 border-brand-600' : errors.agreed ? 'border-red-400' : 'border-zinc-300 group-hover:border-brand-400'}`}>
                                        {agreed && (
                                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-zinc-600 leading-tight">
                                    Concordo com os{' '}
                                    <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">Termos de Uso</a>
                                    {' '}e{' '}
                                    <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">Política de Privacidade</a>
                                </span>
                            </label>
                            {errors.agreed && <p className="mt-1.5 text-xs text-red-500">{errors.agreed}</p>}
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
                                    Criando conta...
                                </>
                            ) : (
                                <>
                                    Criar conta
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-zinc-500 mt-6">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
