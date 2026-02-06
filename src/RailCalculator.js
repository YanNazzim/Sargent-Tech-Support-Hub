/* src/RailCalculator.js */
import React, { useState, useRef } from 'react';
import { X, Scissors, ArrowRight, CheckCircle, AlertTriangle, Layers, Maximize, Info } from 'lucide-react';
import './RailCalculator.css';

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

const GENERATION_OPTIONS = [
    { id: '80_SERIES', label: '80 Series', sub: 'Standard Device' },
    { id: 'PE80_SERIES', label: 'PE80 Series', sub: 'NextGen Device' }
];

const STILE_OPTIONS = [
    { id: 'NARROW', label: 'Narrow Stile', sub: '8300/8400/8500' },
    { id: 'WIDE', label: 'Wide Stile', sub: '8600/8700/8800/8900' }
];

export default function RailCalculator({ onClose }) {
    const [generation, setGeneration] = useState('80_SERIES'); 
    const [stile, setStile] = useState('NARROW'); 
    const [doorWidth, setDoorWidth] = useState('');
    const [result, setResult] = useState(null);
    const resultsRef = useRef(null);

    const calculate = () => {
        const width = parseFloat(doorWidth);
        
        // Validation: Allow any width >= 24"
        if (isNaN(width) || width < 24) {
            setResult({ error: 'Please enter a valid Door Width (minimum 24").' });
            return;
        }

        const spec = FORMULAS[generation][stile];
        
        let sizeLabel = '';
        let rangeLabel = '';
        let uncutLengthDisplay = '';
        let customNote = null;
        let isWarning = false;

        // 1. Determine Rail Size (Standard vs Custom)
        const sizeData = RAIL_SIZES.find(s => width >= s.min && width <= s.max);

        if (sizeData) {
            // STANDARD RANGE (24-48)
            sizeLabel = sizeData.label;
            rangeLabel = `${sizeData.min}" - ${sizeData.max}"`;
            uncutLengthDisplay = spec.uncutMap[sizeData.label].toFixed(3) + '"';
        } else if (width > 48) {
            // CUSTOM / OVERSIZE RANGE (>48)
            sizeLabel = 'Custom / SPAR';
            rangeLabel = `Over 48"`;
            
            if (generation === '80_SERIES') {
                uncutLengthDisplay = "Use NC-E20";
                customNote = "For widths > 48\", request QSPAR using NC-E20.";
            } else {
                // PE80 Series Logic for > 48
                uncutLengthDisplay = "N/A";
                customNote = "Theoretical calculation only. PE80 Series cannot be extended via SPAR/Special Order.";
                isWarning = true;
            }
        } else {
            // Width is between 24 and 48 but falls in a non-standard gap (e.g. 32.5)
            // Or technically should be caught by logic if gaps existed, 
            // but our current RAIL_SIZES are continuous integers.
            // We'll treat "no match" within 48 as an error to match previous behavior if any.
            setResult({ error: 'Door width out of standard ranges (check standard sizes).' });
            return;
        }

        // 2. Calculate Cut Length (Formula remains the same)
        const actualCutLength = width - spec.deduction;

        setResult({
            sizeLabel: sizeLabel,
            range: rangeLabel,
            uncutLength: uncutLengthDisplay,
            cutLength: actualCutLength.toFixed(3),
            deduction: spec.deduction,
            isPE: generation === 'PE80_SERIES',
            stileLabel: stile === 'NARROW' ? (generation === 'PE80_SERIES' ? 'NE (Narrow)' : 'Narrow Stile') : (generation === 'PE80_SERIES' ? 'WE (Wide)' : 'Wide Stile'),
            customNote: customNote,
            isWarning: isWarning
        });

        // Auto Scroll to results
        setTimeout(() => {
            if (resultsRef.current) {
                resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            calculate();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Scissors className="modal-title-icon" style={{ transform: 'rotate(-90deg)', color: '#3b82f6' }}/>
                        Rail Length Calculator
                    </h2>
                    <button onClick={onClose} className="close-button">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* --- IMPORTANT NOTE --- */}
                    <div className="message-box warning">
                        <AlertTriangle size={20} />
                        <span>Calculations are for the rail ONLY (no chassis/end caps).</span>
                    </div>

                    {/* --- STEP 1: GENERATION --- */}
                    <div>
                        <h3 className="group-title">1. Device Generation</h3>
                        <div className="option-grid">
                            {GENERATION_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setGeneration(opt.id)}
                                    className={`option-btn ${generation === opt.id ? 'active' : ''}`}
                                >
                                    <Layers size={20} className="option-icon" />
                                    <div>
                                        <span className="option-label">{opt.label}</span>
                                        <span className="option-sub">{opt.sub}</span>
                                    </div>
                                    {generation === opt.id && <CheckCircle size={18} className="check-icon" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- STEP 2: STILE WIDTH --- */}
                    <div className="fade-in">
                        <h3 className="group-title">2. Stile Width</h3>
                        <div className="option-grid">
                            {STILE_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setStile(opt.id)}
                                    className={`option-btn ${stile === opt.id ? 'active' : ''}`}
                                >
                                    <Maximize size={20} className="option-icon" />
                                    <div>
                                        <span className="option-label">{opt.label}</span>
                                        <span className="option-sub">{opt.sub}</span>
                                    </div>
                                    {stile === opt.id && <CheckCircle size={18} className="check-icon" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- STEP 3: DOOR WIDTH --- */}
                    <div className="fade-in">
                        <h3 className="group-title">3. Door Width</h3>
                        <div className="input-row">
                            <input 
                                type="number" 
                                className="form-input" 
                                placeholder="Enter width in inches (Min 24)" 
                                value={doorWidth}
                                onChange={(e) => setDoorWidth(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>
                        <button onClick={calculate} className="calculate-btn">
                            Calculate Rail <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* --- RESULTS DISPLAY --- */}
                    {result && !result.error && (
                        <div className="fade-in" ref={resultsRef}>
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

                                <div className="rail-results-grid">
                                    <div className="rail-box stock">
                                        <p className="rail-label">Stock / Uncut Length</p>
                                        {/* Allow text wrapping for long strings like "Use NC-E20" */}
                                        <p className="rail-value" style={{ fontSize: isNaN(parseFloat(result.uncutLength)) ? '1.25rem' : '1.75rem' }}>
                                            {result.uncutLength}
                                        </p>
                                        <p className="rail-sub">Full Rail Size</p>
                                    </div>
                                    <div className="rail-box cut">
                                        <p className="rail-label cut-label">Actual Cut Length</p>
                                        <p className="rail-value">{result.cutLength}"</p>
                                        <p className="rail-sub">For {doorWidth}" Door</p>
                                    </div>
                                </div>

                                {/* Custom Note for Oversize/Special Orders */}
                                {result.customNote && (
                                    <div className={`message-box ${result.isWarning ? 'error' : 'warning'}`} style={{ marginTop: '1rem' }}>
                                        <Info size={20} />
                                        <span>{result.customNote}</span>
                                    </div>
                                )}
                                
                                <div className="calc-note">
                                    Calculation: Door Width ({doorWidth}") - Deduction ({result.deduction}")
                                </div>
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