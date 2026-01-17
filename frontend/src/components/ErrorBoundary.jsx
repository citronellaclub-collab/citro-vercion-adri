import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', background: '#0d1117', color: '#f85149', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <h2>Oops! Algo salió mal.</h2>
                    <p>Se ha detectado un error en la interfaz. Por favor, recarga la página.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ background: '#238636', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}>
                        Recargar Aplicación
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
