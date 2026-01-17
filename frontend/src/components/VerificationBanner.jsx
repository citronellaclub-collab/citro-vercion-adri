import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Mail, X } from 'lucide-react';

export default function VerificationBanner() {
    const { user } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');
    const [showBanner, setShowBanner] = useState(true);

    // No mostrar si el usuario está verificado o si el banner fue cerrado
    if (!user || user.emailVerified || !showBanner) {
        return null;
    }

    const handleResend = async () => {
        setIsResending(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('✅ Email de verificación enviado. Revisa tu bandeja de entrada.');
            } else {
                setMessage(`❌ ${data.error || 'Error al enviar email'}`);
            }
        } catch (error) {
            setMessage('❌ Error de conexión. Intenta nuevamente.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            position: 'relative',
            zIndex: 1000
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <AlertTriangle size={20} />
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>
                        ⚠️ Cuenta pendiente de verificación
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                        Verifica tu email para acceder a todas las funcionalidades
                    </p>
                    {message && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontWeight: '500' }}>
                            {message}
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                    onClick={handleResend}
                    disabled={isResending}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: isResending ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        opacity: isResending ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isResending) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                >
                    <Mail size={14} />
                    {isResending ? 'Enviando...' : 'Reenviar Email'}
                </button>

                <button
                    onClick={() => setShowBanner(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
