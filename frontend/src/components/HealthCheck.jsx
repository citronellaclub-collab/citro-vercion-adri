import { useEffect, useState } from 'react';

export default function HealthCheck() {
    const [status, setStatus] = useState('Checking...');

    useEffect(() => {
        fetch('/api/health') // Asume que server.js tendrá este endpoint, si no, usaremos /api/auth/login o similar
            .then(res => {
                if (res.ok) {
                    console.log('✅ Backend Online');
                    setStatus('Online');
                } else {
                    console.warn('⚠️ Backend responded but with error', res.status);
                    setStatus('Error ' + res.status);
                }
            })
            .catch(err => {
                console.error('❌ Backend Unreachable', err);
                setStatus('Offline');
            });
    }, []);

    if (status === 'Online') return null; // Ocultar si está bien

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: status === 'Offline' ? '#da3633' : '#d29922',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999
        }}>
            Backend: {status}
        </div>
    );
}
