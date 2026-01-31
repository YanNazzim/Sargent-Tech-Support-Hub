import React, { useState, useMemo, useRef } from 'react';
import { 
    X, Calculator, AlertTriangle, ArrowRight, ArrowUp, ArrowDown, 
    Disc, Plus, Tag, Info, Search, CheckCircle 
} from 'lucide-react'; 
import './RodCalculator.css'; 

// ----------------------------------------------------------------------------
// DATA CONSTANTS - Based on 2026 ROD LENGTH CALCULATIONS (Rev 4)
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

// Helper: Get Ordering Part Number
const getPartNumber = (series, height, aff) => {
    if (!series || !height || !aff) return null;

    const is5CH = series.includes('5CH');
    const prefix = is5CH ? '5CH-' : '';
    
    let topBase = '';
    let bottomBase = 'N/A'; 
    let topNotes = [];
    let topSuffix = '';
    let bottomSuffix = '';

    // --- 1. SVR 8700 / 9700 / PE8700 ---
    if (series.includes('SVR_8700') || series.includes('SVR_PE8700')) {
        topBase = '670T'; 
        topSuffix = ' x Finish';
        bottomBase = '670B'; 
        bottomSuffix = ' x Finish';
    } 
    // --- 2. SVR 2700 / 3700 ---
    else if (series.includes('SVR_2700_3700')) {
        topBase = '672T';
        topSuffix = ' x Finish';
        bottomBase = '672B';
        bottomSuffix = ' x Finish';
    }
    // --- 3. L Series (8600) ---
    else if (series.includes('CVR_L_8600')) {
        topBase = '692L';
        bottomBase = 'N/A'; 
    }
    // --- 4. 7000 SERIES ---
    else if (series.includes('7000')) {
        bottomBase = '691B'; 
        if (series === '7000_STD') {
            topBase = 'MD694T';
        } else if (series === '7000_WD') {
            topBase = 'WD694T';
        } else if (series === '7000_WD_AUX') {
            topBase = 'WDA694T';
            topNotes = [
                'Requires 3 extra parts for Aux/ELR/Reader:',
                '1. Extension Rod (94-0212)', 
                '2. Plate for Aux Control (68-0917)',
                '3. Screw (01-1137)'
            ];
        }
    }
    // --- 5. PE8400 / PE8600 ---
    else if (series.includes('PE8400') || series.includes('PE8600')) {
        topBase = 'P692T';
        bottomBase = '692B';
    }
    // --- 6. MD/AD 8400 & 8600 (Standard) ---
    else if (series.includes('CVR_8400_MD8600')) {
        topBase = 'MD691T';
        bottomBase = '691B';
    }
    // --- 7. WD8600 No Trim ---
    else if (series.includes('CVR_WD8600_NOTRIM')) {
        topBase = 'WD691T';
        bottomBase = '691B';
    }
    // --- 8. WD8600 With Aux ---
    else if (series.includes('CVR_WD8600_AUX')) {
        topBase = 'WDA691T';
        bottomBase = '691B';
        topNotes = [
            'Requires 3 extra parts for Aux operation:',
            '1. Notched Extension Rod (68-0918)',
            '2. Plate for Aux Control (68-0917)',
            '3. Screw (01-1137)'
        ];
    } 
    else {
        return null; 
    }

    return {
        topRod: `${prefix}${topBase} x ${height} x ${aff}${topSuffix}`,
        bottomRod: bottomBase !== 'N/A' ? `${prefix}${bottomBase} x ${aff}${bottomSuffix}` : 'N/A',
        notes: topNotes
    };
};

// --- Available Options Data ---
const DEVICE_TYPES = [
    { id: 'CVR', label: 'CVR (Concealed)', detail: '8400 / 8600 / L / PE8400 / PE8600' },
    { id: 'SVR', label: 'SVR (Surface)', detail: '2700 / 3700 / 8700 / 9700 / PE8700' },
    { id: '7000', label: '7000 (Multi-Point)', detail: '7000 Series' },
    { id: 'Crossbar', label: 'Crossbar Only', detail: '90 Series' },
];

const SERIES_DATA = {
    'CVR': [
        { value: 'CVR_8400_MD8600_STD', label: '8400 / MD8600 (Std)' },
        { value: 'CVR_WD8600_NOTRIM_STD', label: 'WD8600 No Trim (Std)' },
        { value: 'CVR_WD8600_AUX_STD', label: 'WD8600 w/ Aux (Std)' },
        { value: 'CVR_SN_8600_STD', label: 'SN-MD/WD8600 (Std)' },
        { value: 'CVR_SN_AUX_STD', label: 'SN-MD/WD8600 w/ Aux (Std)' },
        { value: 'CVR_PE8400_PE8600_STD', label: 'PE8400 / PE8600 (Std)' },
        { value: 'CVR_L_8600_STD', label: 'L-Series 8600 (Less Btm Rod)' },
        { value: 'CVR_8400_MD8600_5CH', label: '8400 / MD8600 (5CH)' },
        { value: 'CVR_WD8600_NOTRIM_5CH', label: 'WD8600 No Trim (5CH)' },
        { value: 'CVR_WD8600_AUX_5CH', label: 'WD8600 w/ Aux (5CH)' },
        { value: 'CVR_SN_8600_5CH', label: 'SN-MD/WD8600 (5CH)' },
        { value: 'CVR_SN_AUX_5CH', label: 'SN-MD/WD8600 w/ Aux (5CH)' },
        { value: 'CVR_PE8400_PE8600_5CH', label: 'PE8400 / PE8600 (5CH)' },
    ],
    'SVR': [
        { value: 'SVR_2700_3700', label: '2700 / 3700 Series' },
        { value: 'SVR_8700_9700', label: '8700 / 9700 Series' },
        { value: 'SVR_PE8700', label: 'PE8700 Premium' },
    ],
    '7000': [
        { value: '7000_STD', label: '7000 Series (Std)' },
        { value: '7000_WD', label: 'WD7000 No Trim' },
        { value: '7000_WD_AUX', label: '7000 w/ Aux' },
    ]
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
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState(null); 
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    
    // Ref for scrolling to results
    const resultsRef = useRef(null);

    // Filtered Series Options based on search
    const filteredSeries = useMemo(() => {
        if (!inputs.deviceType || inputs.deviceType === 'Crossbar') return [];
        const options = SERIES_DATA[inputs.deviceType] || [];
        if (!searchTerm) return options;
        return options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [inputs.deviceType, searchTerm]);

    const handleTypeSelect = (typeId) => {
        setInputs({
            deviceType: typeId,
            deviceSeries: '', 
            doorHeight: '',
            aff: '',
            doorWidth: '',
        });
        setSearchTerm('');
        setResults(null);
        setMessage('');
        setIsError(false);
    };

    const handleSeriesSelect = (seriesValue) => {
        setInputs(prev => ({ ...prev, deviceSeries: seriesValue }));
        setResults(null);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (['doorHeight', 'aff', 'doorWidth'].includes(id) && value < 0) return;
        setInputs(prev => ({ ...prev, [id]: value }));
        if(results) setResults(null);
    };

    // Calculate Function
    const calculate = () => {
        const dh = parseFloat(inputs.doorHeight);
        const aff = parseFloat(inputs.aff);
        const dw = parseFloat(inputs.doorWidth);
        const { deviceType, deviceSeries } = inputs;
        
        let tr = 'N/A', br = 'N/A', re = 'N/A', cb = 'N/A';
        let partInfo = null;

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
            
            // LOGIC A: CVR, 7000, SVR 2700/3700
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

                // ** L SERIES SPECIFIC: NO BOTTOM ROD **
                if (deviceSeries.includes('CVR_L_8600')) {
                    br = 'N/A';
                } else {
                    br = aff - P.BR_OFFSET;
                }
            } 
            // LOGIC B: SVR 8700/9700/PE
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

            partInfo = getPartNumber(deviceSeries, dh, aff);
        }

        setResults({ 
            topRodLength: tr, 
            bottomRodLength: br, 
            rodExtension: re, 
            crossbarLength: cb,
            partInfo 
        });
        setMessage('');
        setIsError(false);

        // Auto Scroll to results after short delay for render
        setTimeout(() => {
            if (resultsRef.current) {
                resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    };

    const totalTopLength = (() => {
        if (!results || results.topRodLength === 'N/A' || results.rodExtension === 'N/A') return null;
        const ext = parseFloat(results.rodExtension) || 0;
        const top = parseFloat(results.topRodLength) || 0;
        if (ext <= 0) return null;
        return (top + ext).toFixed(3);
    })();

    // Helper for Enter Key Press
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            calculate();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Calculator className="modal-title-icon" style={{color: '#3b82f6'}} /> 
                        Rod Length Calculator
                    </h2>
                    <button onClick={onClose} className="close-button" aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    
                    {/* --- STEP 1: DEVICE TYPE SELECTION --- */}
                    <div>
                        <h3 className="group-title">1. Select Device Type</h3>
                        <div className="device-type-grid">
                            {DEVICE_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeSelect(type.id)}
                                    className={`device-type-btn ${inputs.deviceType === type.id ? 'active' : ''}`}
                                >
                                    <span className="device-label">{type.label}</span>
                                    <span className="device-detail">{type.detail}</span>
                                    {inputs.deviceType === type.id && <CheckCircle size={18} className="device-check" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- STEP 2: MODEL SELECTION (If not Crossbar) --- */}
                    {inputs.deviceType && inputs.deviceType !== 'Crossbar' && (
                        <div className="fade-in">
                            <h3 className="group-title">2. Select Model</h3>
                            
                            {/* Search Bar */}
                            <div className="search-container">
                                <Search size={20} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search model (e.g., 8600, PE, Aux)..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="model-search-input"
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="model-list custom-scroll">
                                {filteredSeries.length > 0 ? (
                                    filteredSeries.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSeriesSelect(opt.value)}
                                            className={`model-btn ${inputs.deviceSeries === opt.value ? 'active' : ''}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))
                                ) : (
                                    <div className="no-models">
                                        No models found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 3: MEASUREMENTS --- */}
                    {((inputs.deviceType === 'Crossbar') || (inputs.deviceType && inputs.deviceSeries)) && (
                        <div className="fade-in">
                            <h3 className="group-title">
                                {inputs.deviceType === 'Crossbar' ? '2. Measurements' : '3. Measurements'}
                            </h3>
                            <div className="form-grid">
                                {inputs.deviceType !== 'Crossbar' ? (
                                    <>
                                        <div>
                                            <label className="input-label" htmlFor="doorHeight">Door Height (Inches)</label>
                                            <input 
                                                type="number" 
                                                id="doorHeight" 
                                                className="form-input" 
                                                placeholder="e.g. 84" 
                                                value={inputs.doorHeight} 
                                                onChange={handleInputChange} 
                                                onKeyDown={handleKeyDown}
                                                autoFocus 
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label" htmlFor="aff">AFF (Handle Height)</label>
                                            <input 
                                                type="number" 
                                                id="aff" 
                                                className="form-input" 
                                                placeholder="e.g. 41" 
                                                value={inputs.aff} 
                                                onChange={handleInputChange} 
                                                onKeyDown={handleKeyDown}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label" htmlFor="doorWidth">Door Width (Inches)</label>
                                        <input 
                                            type="number" 
                                            id="doorWidth" 
                                            className="form-input" 
                                            placeholder="e.g. 36" 
                                            value={inputs.doorWidth} 
                                            onChange={handleInputChange} 
                                            onKeyDown={handleKeyDown}
                                            autoFocus 
                                        />
                                    </div>
                                )}
                            </div>

                            <button onClick={calculate} className="calculate-button">
                                Calculate Results <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px' }}/>
                            </button>
                        </div>
                    )}
                    
                    {/* --- ERROR MESSAGE --- */}
                    {isError && message && (
                        <div className="message-box error fade-in">
                            <AlertTriangle size={20} />
                            <span>{message}</span>
                        </div>
                    )}

                    {/* --- RESULTS DISPLAY --- */}
                    {results && !isError && (
                        <div className="results-container fade-in" ref={resultsRef}>
                            
                            {/* --- PART NUMBER SECTION --- */}
                            {results.partInfo && (
                                <div className="csr-result-card part-info-card">
                                    <div className="csr-card-header-left">
                                        <Tag size={20} color="#6366f1" />
                                        <h3 className="csr-name" style={{color: '#818cf8'}}>Ordering Part Numbers</h3>
                                    </div>
                                    
                                    <div className={`parts-grid ${results.partInfo.bottomRod !== 'N/A' ? 'two-col' : 'one-col'}`}>
                                        <div className="part-box">
                                            <span className="part-label">Top Rod Part #</span>
                                            <p className="part-number">{results.partInfo.topRod}</p>
                                        </div>

                                        {results.partInfo.bottomRod !== 'N/A' && (
                                            <div className="part-box">
                                                <span className="part-label">Bottom Rod Part #</span>
                                                <p className="part-number">{results.partInfo.bottomRod}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {results.partInfo.notes.length > 0 && (
                                        <div className="part-notes">
                                            <div className="note-header">
                                                <Info size={16} color="#f59e0b"/>
                                                <span>ADDITIONAL PARTS REQUIRED</span>
                                            </div>
                                            {results.partInfo.notes.map((note, idx) => (
                                                <p key={idx} className="note-text">{note}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TOP ASSEMBLY BLOCK */}
                            {results.crossbarLength === 'N/A' && (
                                <div className="csr-result-card top-rod-card">
                                    <div className="assembly-header top">
                                        <div className="csr-card-header-left">
                                            <ArrowUp size={24} color="#3b82f6" />
                                            <h3 className="csr-name">Top Rod Assembly</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="assembly-grid">
                                        <div className="assembly-item">
                                            <p className="assembly-label">Top Rod Length</p>
                                            <p className="assembly-value">{results.topRodLength}"</p>
                                        </div>
                                        <div className="assembly-item">
                                            <p className="assembly-label">Extension</p>
                                            <p className="assembly-value accent">
                                                {parseFloat(results.rodExtension) > 0 ? results.rodExtension + '"' : 'None'}
                                            </p>
                                        </div>
                                    </div>

                                    {totalTopLength && (
                                        <div className="total-length-box">
                                            <Plus size={20} color="#60a5fa" />
                                            <div>
                                                <span className="total-label">TOTAL TOP LENGTH</span>
                                                <span className="total-value">{totalTopLength}"</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BOTTOM ASSEMBLY BLOCK - Hidden for L-Series */}
                            {results.crossbarLength === 'N/A' && results.bottomRodLength !== 'N/A' && (
                                <div className="csr-result-card bottom-rod-card">
                                    <div className="assembly-header bottom">
                                        <div className="csr-card-header-left">
                                            <ArrowDown size={24} color="#10b981" />
                                            <h3 className="csr-name">Bottom Rod Assembly</h3>
                                        </div>
                                    </div>
                                    <div className="assembly-item single">
                                        <p className="assembly-label">Bottom Rod Length</p>
                                        <p className="assembly-value">{results.bottomRodLength}"</p>
                                    </div>
                                </div>
                            )}

                            {/* CROSSBAR BLOCK */}
                            {results.crossbarLength !== 'N/A' && (
                                <div className="csr-result-card crossbar-card">
                                    <Disc size={32} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
                                    <p className="assembly-label">Crossbar Length</p>
                                    <p className="assembly-value">{results.crossbarLength}"</p>
                                    <p className="detail-text">For {inputs.doorWidth}" Door</p>
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