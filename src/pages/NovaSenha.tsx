import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export const NovaSenha: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const { toasts, addToast, removeToast } = useToast();

    const validate = (): boolean => {
        const errs: { password?: string; confirmPassword?: string } = {};
        if (!password) {
            errs.password = 'Nova senha é obrigatória';
        } else if (password.length < 8) {
            errs.password = 'A senha deve ter pelo menos 8 caracteres';
        }
        if (!confirmPassword) {
            errs.confirmPassword = 'Confirme a nova senha';
        } else if (password !== confirmPassword) {
            errs.confirmPassword = 'As senhas não coincidem';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        // Note: NovaSenha deve acessar supabase diretamente pois não usa signIn/signUp/resetPassword do AuthContext
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast('Senha atualizada com sucesso! Redirecionando...', 'success');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
    };

    const clearError = (field: keyof typeof errors) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

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
                        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Criar nova senha 🔒</h1>
                        <p className="text-zinc-500 text-sm">Escolha uma senha segura com pelo menos 8 caracteres.</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nova senha</label>
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
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirmar nova senha</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Repita a nova senha"
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

                        {/* Password strength indicator */}
                        {password.length > 0 && (
                            <div>
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-colors ${password.length >= level * 3
                                                    ? password.length >= 12
                                                        ? 'bg-emerald-400'
                                                        : password.length >= 9
                                                            ? 'bg-yellow-400'
                                                            : 'bg-red-400'
                                                    : 'bg-zinc-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-400">
                                    {password.length >= 12 ? 'Senha forte 💪' : password.length >= 9 ? 'Senha média' : 'Senha fraca'}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar nova senha'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
