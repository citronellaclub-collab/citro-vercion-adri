import React from 'react';

export default function CropTrends({ logs }) {
    if (!logs || logs.length < 2) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e', background: '#0d1117', borderRadius: '12px', border: '1px solid #30363d' }}>
                <p>Se necesitan al menos 2 registros para mostrar tendencias.</p>
            </div>
        );
    }

    // reverse logs to show chronological order (left to right)
    const trendData = [...logs].reverse();

    const width = 400;
    const height = 150;
    const padding = 20;

    const getPoints = (key, minVal, maxVal, color) => {
        const step = (width - padding * 2) / (trendData.length - 1);
        return trendData.map((log, i) => {
            const x = padding + i * step;
            // Normalize y: (val - min) / (max - min)
            const range = maxVal - minVal || 1;
            const y = height - padding - ((log[key] - minVal) / range) * (height - padding * 2);
            return `${x},${y}`;
        }).join(' ');
    };

    const phMin = 4, phMax = 8;
    const ecMin = 0, ecMax = 3;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* pH Chart */}
            <div style={{ background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#8b949e', display: 'flex', justifyContent: 'space-between' }}>
                    Tendencia pH <span>Ideal: 5.5 - 6.5</span>
                </h4>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Grid lines */}
                    <line x1={padding} y1={height - padding - ((5.5 - phMin) / (phMax - phMin)) * (height - padding * 2)} x2={width - padding} y2={height - padding - ((5.5 - phMin) / (phMax - phMin)) * (height - padding * 2)} stroke="#238636" strokeDasharray="4" opacity="0.3" />
                    <line x1={padding} y1={height - padding - ((6.5 - phMin) / (phMax - phMin)) * (height - padding * 2)} x2={width - padding} y2={height - padding - ((6.5 - phMin) / (phMax - phMin)) * (height - padding * 2)} stroke="#238636" strokeDasharray="4" opacity="0.3" />

                    <polyline
                        fill="none"
                        stroke="#3fb950"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        points={getPoints('ph', phMin, phMax)}
                    />
                    {trendData.map((log, i) => {
                        const step = (width - padding * 2) / (trendData.length - 1);
                        const x = padding + i * step;
                        const y = height - padding - ((log.ph - phMin) / (phMax - phMin)) * (height - padding * 2);
                        return <circle key={i} cx={x} cy={y} r="4" fill="#3fb950" />;
                    })}
                </svg>
            </div>

            {/* EC Chart */}
            <div style={{ background: '#161b22', padding: '20px', borderRadius: '12px', border: '1px solid #30363d' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#8b949e' }}>Tendencia EC (mS/cm)</h4>
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                    <polyline
                        fill="none"
                        stroke="#a5d6ff"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        points={getPoints('ec', ecMin, ecMax)}
                    />
                    {trendData.map((log, i) => {
                        const step = (width - padding * 2) / (trendData.length - 1);
                        const x = padding + i * step;
                        const y = height - padding - ((log.ec - ecMin) / (ecMax - ecMin)) * (height - padding * 2);
                        return <circle key={i} cx={x} cy={y} r="4" fill="#a5d6ff" />;
                    })}
                </svg>
            </div>
        </div>
    );
}
