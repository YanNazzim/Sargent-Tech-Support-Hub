import React, { useState, useEffect, useCallback } from 'react';
import { X, Calculator, AlertTriangle, ArrowRight, ArrowUp, ArrowDown, Disc, Plus } from 'lucide-react'; 

// ----------------------------------------------------------------------------
// DATA CONSTANTS - Based on 2026 ROD LENGTH CALCULATIONS (Rev 4)
// ** LOGIC PRESERVED EXACTLY AS REQUESTED **
// ----------------------------------------------------------------------------
const CONSTANTS = {
    // --- CONCEALED VERTICAL RODS (CVR) - STANDARD ---
    'CVR_8400_MD8600_STD':      { DH_OFFSET: 13.000, RE_OFFSET: 49.000, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_WD8600_NOTRIM_STD':    { DH_OFFSET: 6.250,  RE_OFFSET: 42.250, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_WD8600_AUX_STD':       { DH_OFFSET: 11.625, RE_OFFSET: 47.625, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_SN_8600_STD':          { DH_OFFSET: 6.250,  RE_OFFSET: 42.250, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_SN_AUX_STD':           { DH_OFFSET: 17.625, RE_OFFSET: 53.625, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_PE8400_PE8600_STD':    { DH_OFFSET: 6.250,  RE_OFFSET: 42.250, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_L_8600_STD':           { DH_OFFSET: 9.250,  RE_OFFSET: 45.250, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    
    // --- CONCEALED VERTICAL RODS (CVR) - 5CH ---
    'CVR_8400_MD8600_5CH':      { DH_OFFSET: 14.500, RE_OFFSET: 50.500, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_WD8600_NOTRIM_5CH':    { DH_OFFSET: 7.750,  RE_OFFSET: 43.750, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_WD8600_AUX_5CH':       { DH_OFFSET: 13.125, RE_OFFSET: 49.125, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_SN_8600_5CH':          { DH_OFFSET: 7.750,  RE_OFFSET: 43.750, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_SN_AUX_5CH':           { DH_OFFSET: 19.125, RE_OFFSET: 53.625, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    'CVR_PE8400_PE8600_5CH':    { DH_OFFSET: 7.750,  RE_OFFSET: 43.750, MAX_ROD: 42.750, TR_STD: 35.000, BR_OFFSET: 12.125 },
    
    // --- MULTI-POINT LOCK (7000 Series) ---
    '7000_STD':     { DH_OFFSET: 18.125, RE_OFFSET: 56.125, MAX_ROD: 43.750, TR_STD: 37.750, BR_OFFSET: 7.000 },
    '7000_WD':      { DH_OFFSET: 11.375, RE_OFFSET: 49.375, MAX_ROD: 43.750, TR_STD: 37.750, BR_OFFSET: 7.000 },
    '7000_WD_AUX':  { DH_OFFSET: 16.750, RE_OFFSET: 54.750, MAX_ROD: 43.750, TR_STD: 37.750, BR_OFFSET: 7.000 },

    // --- SURFACE VERTICAL RODS (SVR) ---
    'SVR_2700_3700': { DH_OFFSET: 4.125, RE_OFFSET: 39.125, MAX_ROD: 49.000, TR_STD: 38.875, BR_OFFSET: 3.625 },

    // 8700/9700/PE: Fixed Extension 35.750 if extended
    'SVR_8700_9700': { DH_OFFSET: 6.500, MAX_ROD: 55.000, RE_FIXED: 35.750, TR_ADJ: 0.250, BR_OFFSET: 5.000 },
    'SVR_PE8700':    { DH_OFFSET: 6.500, MAX_ROD: 55.000, RE_FIXED: 35.750, TR_ADJ: 0.250, BR_OFFSET: 5.000 },
    
    // --- CROSSBAR ---
    'CROSSBAR_STD': 4.625 
};

// Rounding Helper (.25 increments)
const roundToRodStandard = (num) => {
    if (isNaN(num) || num === 'N/A') return num;
    const val = parseFloat(num);
    if (val <= 0) return "0.000";
    return (Math.ceil(val * 4) / 4).toFixed(3);
};

// --- Main Component ---
const RodCalculator = ({ onClose }) => {
    const [inputs, setInputs] = useState({
        deviceType: '',
        deviceSeries: '',
        doorHeight: '',
        aff: '',
        doorWidth: '',
    });
    const [seriesOptions, setSeriesOptions] = useState([]);
    const [results, setResults] = useState(null); 
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (['doorHeight', 'aff', 'doorWidth'].includes(id) && value < 0) return;
        setInputs(prev => ({ ...prev, [id]: value }));
        // Clear results when input changes to encourage recalculation
        if(results) setResults(null);
    };

    const updateSeriesOptions = useCallback((type) => {
        let options = [];
        if (type === 'CVR') {
            options = [
                { value: 'CVR_8400_MD8600_STD', label: '8400 / MD8600 (Std)' },
                { value: 'CVR_WD8600_NOTRIM_STD', label: 'WD8600 No Trim (Std)' },
                { value: 'CVR_WD8600_AUX_STD', label: 'WD8600 w/ Aux (Std)' },
                { value: 'CVR_SN_8600_STD', label: 'SN-MD/WD8600 (Std)' },
                { value: 'CVR_SN_AUX_STD', label: 'SN-MD/WD8600 w/ Aux (Std)' },
                { value: 'CVR_PE8400_PE8600_STD', label: 'PE8400 / PE8600 (Std)' },
                { value: 'CVR_L_8600_STD', label: 'L-Series 8600 (Std)' },
                { value: 'CVR_8400_MD8600_5CH', label: '8400 / MD8600 (5CH)' },
                { value: 'CVR_WD8600_NOTRIM_5CH', label: 'WD8600 No Trim (5CH)' },
                { value: 'CVR_WD8600_AUX_5CH', label: 'WD8600 w/ Aux (5CH)' },
                { value: 'CVR_SN_8600_5CH', label: 'SN-MD/WD8600 (5CH)' },
                { value: 'CVR_SN_AUX_5CH', label: 'SN-MD/WD8600 w/ Aux (5CH)' },
                { value: 'CVR_PE8400_PE8600_5CH', label: 'PE8400 / PE8600 (5CH)' },
            ];
        } else if (type === 'SVR') {
            options = [
                { value: 'SVR_2700_3700', label: '2700 / 3700 Series' },
                { value: 'SVR_8700_9700', label: '8700 / 9700 Series' },
                { value: 'SVR_PE8700', label: 'PE8700 Premium' },
            ];
        } else if (type === '7000') {
            options = [
                { value: '7000_STD', label: '7000 Series (Std)' },
                { value: '7000_WD', label: 'WD7000 No Trim' },
                { value: '7000_WD_AUX', label: '7000 w/ Aux' },
            ];
        }
        setSeriesOptions(options);
        setInputs(prev => ({ ...prev, deviceSeries: '' }));
    }, []);

    useEffect(() => {
        updateSeriesOptions(inputs.deviceType);
    }, [inputs.deviceType, updateSeriesOptions]);

    const calculate = () => {
        const dh = parseFloat(inputs.doorHeight);
        const aff = parseFloat(inputs.aff);
        const dw = parseFloat(inputs.doorWidth);
        const { deviceType, deviceSeries } = inputs;
        
        let tr = 'N/A', br = 'N/A', re = 'N/A', cb = 'N/A';

        if (deviceType === 'Crossbar') {
            if (isNaN(dw) || dw <= 0) {
                setMessage('Enter valid Door Width'); setIsError(true); return;
            }
            cb = roundToRodStandard(dw - CONSTANTS.CROSSBAR_STD);
        } else {
            if (isNaN(dh) || isNaN(aff) || dh <= 0 || aff <= 0 || !deviceSeries) {
                setMessage('Please complete all fields'); setIsError(true); return;
            }

            const P = CONSTANTS[deviceSeries];
            
            // LOGIC A: CVR, 7000, SVR 2700/3700 (Calculated Extension)
            if (deviceType === 'CVR' || deviceType === '7000' || deviceSeries === 'SVR_2700_3700') {
                const rodSpace = dh - aff - P.DH_OFFSET;
                
                if (rodSpace > P.MAX_ROD) {
                    if (deviceSeries === 'SVR_2700_3700') {
                        re = (dh - aff - P.DH_OFFSET - P.RE_OFFSET);
                    } else {
                        re = (dh - aff - P.RE_OFFSET);
                    }
                    tr = P.TR_STD;
                } else {
                    re = 0;
                    tr = rodSpace;
                }
                br = aff - P.BR_OFFSET;
            } 
            // LOGIC B: SVR 8700/9700/PE (Fixed Extension)
            else if (deviceType === 'SVR') {
                 if ((dh - aff) > P.MAX_ROD) {
                     re = P.RE_FIXED;
                     tr = (dh - aff - P.RE_FIXED - P.DH_OFFSET - P.TR_ADJ);
                 } else {
                     re = 0;
                     tr = (dh - aff - P.DH_OFFSET);
                 }
                 br = aff - P.BR_OFFSET;
            }
            
            tr = roundToRodStandard(tr);
            br = roundToRodStandard(br);
            re = roundToRodStandard(re);
        }

        setResults({ topRodLength: tr, bottomRodLength: br, rodExtension: re, crossbarLength: cb });
        setMessage('');
        setIsError(false);
    };

    // Calculate Total Top Length helper
    const getTotalTopLength = () => {
        if (!results || results.topRodLength === 'N/A' || results.rodExtension === 'N/A') return null;
        const ext = parseFloat(results.rodExtension) || 0;
        const top = parseFloat(results.topRodLength) || 0;
        if (ext <= 0) return null;
        return (top + ext).toFixed(3);
    };

    const totalTopLength = getTotalTopLength();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Calculator className="modal-title-icon" style={{color: '#3b82f6'}} /> 
                        Rod Length Calculator (2026)
                    </h2>
                    <button onClick={onClose} className="close-button" aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="input-group-wrapper">
                        {/* 1. Device Selection */}
                        <div className="input-group device-select-group">
                            <h3 className="group-title">1. Device Configuration</h3>
                            <div className="form-grid">
                                <div>
                                    <label className="input-label" htmlFor="deviceType">Device Type</label>
                                    <select id="deviceType" className="form-select" value={inputs.deviceType} onChange={handleInputChange}>
                                        <option value="">-- Select Type --</option>
                                        <option value="CVR">CVR (Concealed)</option>
                                        <option value="SVR">SVR (Surface)</option>
                                        <option value="7000">7000 (Multi-Point)</option>
                                        <option value="Crossbar">Crossbar Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label" htmlFor="deviceSeries">Series Model</label>
                                    <select id="deviceSeries" className="form-select" value={inputs.deviceSeries} onChange={handleInputChange} disabled={!seriesOptions.length}>
                                        <option value="">-- Select Series --</option>
                                        {seriesOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Measurements */}
                        <div className="input-group measurement-input-group">
                            <h3 className="group-title">2. Measurements</h3>
                            <div className="form-grid">
                                {inputs.deviceType !== 'Crossbar' ? (
                                    <>
                                        <div>
                                            <label className="input-label" htmlFor="doorHeight">Door Height (Inches)</label>
                                            <input type="number" id="doorHeight" className="form-input" placeholder="e.g. 84" value={inputs.doorHeight} onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="input-label" htmlFor="aff">AFF (Handle Height)</label>
                                            <input type="number" id="aff" className="form-input" placeholder="e.g. 41" value={inputs.aff} onChange={handleInputChange} />
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label" htmlFor="doorWidth">Door Width (Inches)</label>
                                        <input type="number" id="doorWidth" className="form-input" placeholder="e.g. 36" value={inputs.doorWidth} onChange={handleInputChange} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button onClick={calculate} className="calculate-button" style={{ marginBottom: '1.5rem' }}>
                        Calculate Lengths <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px' }}/>
                    </button>
                    
                    {/* --- ERROR MESSAGE --- */}
                    {isError && message && (
                        <div className="message-box error fade-in" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={20} />
                            <span>{message}</span>
                        </div>
                    )}

                    {/* --- RESULTS DISPLAY (INLINE) --- */}
                    {results && !isError && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* TOP ASSEMBLY BLOCK */}
                            {results.crossbarLength === 'N/A' && (
                                <div className="csr-result-card" style={{ 
                                    background: '#1e293b', 
                                    borderLeft: '5px solid #3b82f6',
                                    padding: '0' // Remove default padding to control inner layout
                                }}>
                                    <div style={{ padding: '1rem 1.5rem', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <div className="csr-card-header-left">
                                            <ArrowUp size={24} color="#3b82f6" />
                                            <h3 className="csr-name" style={{fontSize: '1.1rem'}}>Top Rod Assembly</h3>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
                                        {/* Top Rod */}
                                        <div style={{ padding: '1.5rem', textAlign: 'center', background: '#1e293b' }}>
                                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Top Rod Length</p>
                                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', margin: '0.5rem 0' }}>{results.topRodLength}"</p>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Standard</p>
                                        </div>
                                        {/* Extension */}
                                        <div style={{ padding: '1.5rem', textAlign: 'center', background: '#1e293b' }}>
                                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Extension</p>
                                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#60a5fa', margin: '0.5rem 0' }}>
                                                {parseFloat(results.rodExtension) > 0 ? results.rodExtension + '"' : 'None'}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {parseFloat(results.rodExtension) > 0 ? 'Required' : 'Not needed'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Total Length Sum - Only visible if Extension exists */}
                                    {totalTopLength && (
                                        <div style={{ 
                                            background: 'rgba(59, 130, 246, 0.15)', 
                                            padding: '1rem', 
                                            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                                            textAlign: 'center',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <Plus size={20} color="#60a5fa" />
                                            <div style={{ textAlign: 'left' }}>
                                                <span style={{ color: '#93c5fd', fontSize: '0.9rem', fontWeight: '600', display: 'block' }}>TOTAL TOP LENGTH</span>
                                                <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold' }}>{totalTopLength}"</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BOTTOM ASSEMBLY BLOCK */}
                            {results.crossbarLength === 'N/A' && (
                                <div className="csr-result-card" style={{ 
                                    background: '#1e293b', 
                                    borderLeft: '5px solid #10b981',
                                    padding: '0'
                                }}>
                                    <div style={{ padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div className="csr-card-header-left">
                                            <ArrowDown size={24} color="#10b981" />
                                            <h3 className="csr-name" style={{fontSize: '1.1rem'}}>Bottom Rod Assembly</h3>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Bottom Rod Length</p>
                                        <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', margin: '0.5rem 0' }}>{results.bottomRodLength}"</p>
                                    </div>
                                </div>
                            )}

                            {/* CROSSBAR BLOCK */}
                            {results.crossbarLength !== 'N/A' && (
                                <div className="csr-result-card" style={{ background: '#1e293b', borderLeft: '5px solid #f59e0b', padding: '1.5rem', textAlign: 'center' }}>
                                    <Disc size={32} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Crossbar Length</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: '0.5rem 0' }}>{results.crossbarLength}"</p>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>For {inputs.doorWidth}" Door</p>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RodCalculator;