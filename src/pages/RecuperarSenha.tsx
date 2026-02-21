import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, Mail, ArrowLeft, Loader2, Mail as MailIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export const RecuperarSenha: React.FC = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    const validate = (): boolean => {
        if (!email) {
            setEmailError('E-mail é obrigatório');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError('E-mail inválido');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        const { error } = await resetPassword(email);
        setLoading(false);
        if (error) {
            addToast(error.message, 'error');
        } else {
            setSent(true);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        const { error } = await resetPassword(email);
        setLoading(false);
        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast('E-mail reenviado com sucesso!', 'success');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
                    {/* Back link */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors mb-6 -ml-1"
                    >
                        <ArrowLeft size={15} />
                        Voltar para o login
                    </Link>

                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Hexagon className="text-brand-600 fill-brand-600" size={28} />
                        <span className="text-xl font-bold text-zinc-900 tracking-tight">MajorLeads</span>
                    </div>

                    {!sent ? (
                        <>
                            {/* Header */}
                            <div className="mb-7">
                                <h1 className="text-2xl font-bold text-zinc-900 mb-1">Recuperar senha 🔑</h1>
                                <p className="text-zinc-500 text-sm">
                                    Informe seu e-mail e enviaremos um link para criar uma nova senha.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">E-mail</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                                            className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 ${emailError ? 'border-red-400 focus:border-red-400' : 'border-zinc-300 focus:border-brand-500'}`}
                                        />
                                    </div>
                                    {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar link de recuperação'
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <MailIcon size={28} className="text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-2">E-mail enviado! ✅</h2>
                            <p className="text-zinc-500 text-sm mb-1">
                                Verifique sua caixa de entrada em{' '}
                                <span className="font-medium text-zinc-700">{email}</span>.
                            </p>
                            <p className="text-zinc-400 text-xs mb-8">O link expira em 1 hora.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm bg-white"
                                >
                                    {loading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={15} />
                                    )}
                                    Reenviar e-mail
                                </button>
                                <Link
                                    to="/login"
                                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                                >
                                    Voltar para o login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
