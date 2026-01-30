import React, { useState } from 'react';
import { X, Scissors, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

// --- DATA: RAIL SPECS ---
const RAIL_SIZES = [
    { label: 'E Size', min: 24, max: 32 },
    { label: 'F Size', min: 33, max: 36 },
    { label: 'J Size', min: 37, max: 42 },
    { label: 'G Size', min: 43, max: 48 },
];

// Formulas derived from 80 Series and PE80 Series documentation
const FORMULAS = {
    '80_SERIES': {
        NARROW: {
            deduction: 3.395,
            uncutMap: { 'E Size': 28.605, 'F Size': 32.605, 'J Size': 38.605, 'G Size': 44.605 }
        },
        WIDE: {
            deduction: 6.58, // Derived from 24" -> 17.42"
            uncutMap: { 'E Size': 25.42, 'F Size': 29.42, 'J Size': 35.42, 'G Size': 41.42 }
        }
    },
    'PE80_SERIES': {
        // NE = Narrow Stile
        NARROW: {
            deduction: 4.138, // Derived from 24" -> 19.862"
            uncutMap: { 'E Size': 27.862, 'F Size': 31.862, 'J Size': 37.862, 'G Size': 43.862 }
        },
        // WE = Wide Stile
        WIDE: {
            deduction: 7.323, // Derived from 32" -> 24.677"
            uncutMap: { 'E Size': 24.677, 'F Size': 28.677, 'J Size': 34.677, 'G Size': 40.677 }
        }
    }
};

export default function RailCalculator({ onClose }) {
    const [generation, setGeneration] = useState('80_SERIES'); // '80_SERIES' or 'PE80_SERIES'
    const [stile, setStile] = useState('NARROW'); // 'NARROW' or 'WIDE'
    const [doorWidth, setDoorWidth] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        const width = parseFloat(doorWidth);
        if (isNaN(width) || width < 24 || width > 48) {
            setResult({ error: 'Please enter a valid Door Width between 24" and 48".' });
            return;
        }

        // 1. Determine Rail Size (E, F, J, G)
        const sizeData = RAIL_SIZES.find(s => width >= s.min && width <= s.max);
        if (!sizeData) {
            setResult({ error: 'Door width out of standard range (24"-48").' });
            return;
        }

        // 2. Get Formula Data
        const spec = FORMULAS[generation][stile];
        
        // 3. Calculate Values
        const uncutLength = spec.uncutMap[sizeData.label];
        const actualCutLength = width - spec.deduction;

        setResult({
            sizeLabel: sizeData.label,
            range: `${sizeData.min}" - ${sizeData.max}"`,
            uncutLength: uncutLength.toFixed(3),
            cutLength: actualCutLength.toFixed(3),
            deduction: spec.deduction,
            isPE: generation === 'PE80_SERIES',
            stileLabel: stile === 'NARROW' ? (generation === 'PE80_SERIES' ? 'NE (Narrow)' : 'Narrow Stile') : (generation === 'PE80_SERIES' ? 'WE (Wide)' : 'Wide Stile')
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Scissors className="modal-title-icon" style={{ transform: 'rotate(-90deg)' }}/>
                        Rail Length Calculator
                    </h2>
                    <button onClick={onClose} className="close-button">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* --- CONTROLS --- */}
                    <div className="input-group-wrapper">
                        {/* Generation & Stile */}
                        <div className="form-grid">
                            <div className="input-group">
                                <label className="input-label">Device Generation</label>
                                <select 
                                    className="form-select" 
                                    value={generation} 
                                    onChange={(e) => setGeneration(e.target.value)}
                                >
                                    <option value="80_SERIES">80 Series (Standard)</option>
                                    <option value="PE80_SERIES">PE80 Series (NextGen)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Stile Width</label>
                                <select 
                                    className="form-select" 
                                    value={stile} 
                                    onChange={(e) => setStile(e.target.value)}
                                >
                                    <option value="NARROW">Narrow Stile {generation === 'PE80_SERIES' ? '(NE)' : ''}</option>
                                    <option value="WIDE">Wide Stile {generation === 'PE80_SERIES' ? '(WE)' : ''}</option>
                                </select>
                            </div>
                        </div>

                        {/* Door Width Input */}
                        <div className="input-group measurement-input-group">
                            <label className="input-label" htmlFor="rail-dw">Door Width (Inches)</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    id="rail-dw"
                                    type="number" 
                                    className="form-input" 
                                    placeholder="e.g. 36" 
                                    value={doorWidth}
                                    onChange={(e) => setDoorWidth(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && calculate()}
                                />
                                <button onClick={calculate} className="calculate-button" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                                    Calculate <ArrowRight size={18} style={{ marginLeft: 8 }}/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- RESULTS DISPLAY --- */}
                    {result && !result.error && (
                        <div className="fade-in">
                            <div className="csr-result-card" style={{ 
                                background: '#1e293b', 
                                borderLeft: '5px solid #3b82f6',
                                marginTop: '1rem'
                            }}>
                                <div className="csr-card-top-row">
                                    <div className="csr-card-header-left">
                                        <CheckCircle size={32} color="#3b82f6" />
                                        <div>
                                            <h3 className="csr-name">{result.sizeLabel} Rail</h3>
                                            <p className="csr-region-label">For Door Widths {result.range}</p>
                                        </div>
                                    </div>
                                    <div className="brand-badge" style={{ background: result.isPE ? '#7c3aed' : '#1e3a8a', color: '#fff' }}>
                                        {result.isPE ? 'PE80 Series' : '80 Series'}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Stock / Uncut Length</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: '0.5rem 0' }}>{result.uncutLength}"</p>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Full Rail Size</p>
                                    </div>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: '600' }}>Actual Cut Length</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: '0.5rem 0' }}>{result.cutLength}"</p>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>For {doorWidth}" Door</p>
                                    </div>
                                </div>
                                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                                    Calculation: Door Width ({doorWidth}") - Deduction ({result.deduction}")
                                </p>
                            </div>
                        </div>
                    )}

                    {result && result.error && (
                        <div className="message-box error fade-in" style={{ marginTop: '1rem' }}>
                            <AlertTriangle size={20} />
                            <span>{result.error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}