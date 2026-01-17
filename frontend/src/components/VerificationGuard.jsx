import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

export default function VerificationGuard({ children, action = "realizar esta acción" }) {
    const { user } = useAuth();

    if (!user?.emailVerified) {
        return (
            <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '2px dashed #f59e0b',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                margin: '20px 0'
            }}>
                <Lock size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: '#f59e0b', margin: '0 0 8px 0' }}>
                    Verificación Requerida
                </h3>
                <p style={{ color: '#8b949e', margin: 0 }}>
                    Debes verificar tu email para {action}
                </p>
            </div>
        );
    }

    return children;
}
