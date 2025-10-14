import React, { useState, useEffect, useCallback } from 'react';
import { Ruler, X, AlertTriangle, CheckCircle, Calculator, Box, TrendingUp, TrendingDown } from 'lucide-react'; 
import './App.css'; // Import the custom CSS

// Constants have been updated based on CVR spreadsheet values (DH=96, AFF=39.9375)
const CONSTANTS = {
    
    // --- CONCEALED VERTICAL RODS (CVR) - STD LENGTHS ---
    // Note: BR_OFFSET is now 12.125 for most to match the BR of 27.8125
    'CVR_8400_MD8600_STD': { DH_OFFSET: 13.000, MAX_STD_ROD: 43.750, RE_OFFSET: 49.000, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_WD8600_NOTRIM_STD': { DH_OFFSET: 6.250, MAX_STD_ROD: 43.750, RE_OFFSET: 42.250, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_WD8600_AUX_STD': { DH_OFFSET: 8.4375, MAX_STD_ROD: 43.750, RE_OFFSET: 47.625, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_H1_8600_STD': { DH_OFFSET: 6.250, MAX_STD_ROD: 43.750, RE_OFFSET: 42.250, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_H1_AUX_STD': { DH_OFFSET: 17.625, MAX_STD_ROD: 43.750, RE_OFFSET: 49.000, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_PE8400_PE8600_STD': { DH_OFFSET: 6.250, MAX_STD_ROD: 43.750, RE_OFFSET: 42.250, TR_STD: 35.750, BR_OFFSET: 12.125 },
    // BR=0 for LP/LS/LR8600 (AFF - BR_OFFSET = 0)
    'CVR_L_8600_STD': { DH_OFFSET: 10.8125, MAX_STD_ROD: 43.750, RE_OFFSET: 45.250, TR_STD: 35.750, BR_OFFSET: 39.9375 },
    
    // --- CONCEALED VERTICAL RODS (CVR) - 5CH LENGTHS ---
    'CVR_8400_MD8600_5CH': { DH_OFFSET: 14.500, MAX_STD_ROD: 43.750, RE_OFFSET: 49.000, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_WD8600_NOTRIM_5CH': { DH_OFFSET: 7.750, MAX_STD_ROD: 43.750, RE_OFFSET: 43.750, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_WD8600_AUX_5CH': { DH_OFFSET: 13.125, MAX_STD_ROD: 43.750, RE_OFFSET: 49.125, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_H1_8600_5CH': { DH_OFFSET: 7.750, MAX_STD_ROD: 43.750, RE_OFFSET: 43.750, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_H1_AUX_5CH': { DH_OFFSET: 19.125, MAX_STD_ROD: 43.750, RE_OFFSET: 49.000, TR_STD: 35.750, BR_OFFSET: 12.125 },
    'CVR_PE8400_PE8600_5CH': { DH_OFFSET: 7.750, MAX_STD_ROD: 43.750, RE_OFFSET: 43.750, TR_STD: 35.750, BR_OFFSET: 12.125 },
    
    // --- SURFACE VERTICAL RODS (SVR) ---
    'SVR_2700_3700': { DH_OFFSET: 4.125, MAX_STD_ROD: 49.000, RE_OFFSET: 39.125, TR_STD: 38.875, BR_OFFSET: 3.625 },
    // BR_OFFSET updated to 5.000 (from 7.000) to match 36" BR length for 41" AFF
    'SVR_8700_9700': { DH_OFFSET: 6.500, MAX_STD_ROD: 55.000, RE_STD: 30.500, TR_ADJ: 0.250, BR_OFFSET: 5.000 },
    // BR_OFFSET updated to 5.000 (from 6.500) to match 36" BR length for 41" AFF
    'SVR_PE8700': { DH_OFFSET: 6.500, MAX_STD_ROD: 55.000, RE_STD: 30.500, TR_ADJ: 0.250, BR_OFFSET: 5.000 },
    
    // --- CROSSBAR ---
    'CROSSBAR_STD': 4.625 
};

// Component for the Result Modal (Styled with pure CSS)
const ResultModal = ({ results, message, isError, onClose }) => {
    
    const resultItems = [
        { key: 'topRodLength', label: 'Top Rod Length', icon: TrendingUp },
        { key: 'bottomRodLength', label: 'Bottom Rod Length', icon: TrendingDown },
        { key: 'rodExtension', label: 'Rod Extension', icon: Box },
        { key: 'crossbarLength', label: 'Crossbar Length', icon: Ruler },
    ].filter(item => results[item.key] && results[item.key] !== 'N/A');

    return (
        <div 
            className="modal-overlay"
            onClick={onClose} 
        >
            <div 
                className="result-modal"
                onClick={e => e.stopPropagation()} 
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="result-modal-header">
                    <h2 id="modal-title" className="result-modal-title">
                        <Ruler style={{ marginRight: '0.75rem', height: '1.75rem', width: '1.75rem' }} />
                        Calculation Results
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="close-button"
                        aria-label="Close results modal"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="result-grid">
                    {resultItems.map(item => {
                        const Icon = item.icon;
                        const value = results[item.key];
                        return (
                            <div key={item.key} className="result-card">
                                <div>
                                    <p className="result-label">
                                        {item.label}
                                    </p>
                                    <p className="result-value">{value}</p>
                                    <p className="result-unit">Inches</p>
                                </div>
                                <Icon className="result-icon" aria-hidden="true" />
                            </div>
                        );
                    })}
                </div>
                
                {message && (
                    <div className={`message-box ${isError ? 'error-message' : 'success-message'}`}>
                        {isError ? <AlertTriangle className="message-icon" /> : <CheckCircle className="message-icon" />}
                        <p className="message-text">{message}</p>
                    </div>
                )}
                
                <button 
                    onClick={onClose} 
                    className="close-result-button"
                >
                    Done
                </button>
            </div>
        </div>
    );
};


const RodCalculator = ({ onClose }) => {
    // State and handlers (unchanged from your previous logic)
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
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false); 

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (['doorHeight', 'aff', 'doorWidth'].includes(id)) {
            if (value < 0) return;
        }
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    const updateSeriesOptions = useCallback((type) => {
        let options = [];
        if (type === 'CVR') {
            options = [
                // Standard Rods
                { value: 'CVR_8400_MD8600_STD', label: 'STD Rods: 8400 / MD8600' },
                { value: 'CVR_WD8600_NOTRIM_STD', label: 'STD Rods: WD8600 W/ ET OR NO TRIM' },
                { value: 'CVR_WD8600_AUX_STD', label: 'STD Rods: WD8600 W/ AUX CONTROL' },
                { value: 'CVR_H1_8600_STD', label: 'STD Rods: H1-MD8600 / H1-WD8600' },
                { value: 'CVR_H1_AUX_STD', label: 'STD Rods: H1-MD/WD8600 W/ AUX' },
                { value: 'CVR_PE8400_PE8600_STD', label: 'STD Rods: PE8400 / PE8600' },
                { value: 'CVR_L_8600_STD', label: 'STD Rods: LP8600 / LS8600 / LR8600 (BR=0)' },
                // 5CH Rods
                { value: 'CVR_8400_MD8600_5CH', label: '5CH Rods: 8400 / MD8600' },
                { value: 'CVR_WD8600_NOTRIM_5CH', label: '5CH Rods: WD8600 W/ ET OR NO TRIM' },
                { value: 'CVR_WD8600_AUX_5CH', label: '5CH Rods: WD8600 W/ AUX CONTROL' },
                { value: 'CVR_H1_8600_5CH', label: '5CH Rods: H1-MD8600 / H1-WD8600' },
                { value: 'CVR_H1_AUX_5CH', label: '5CH Rods: H1-MD/WD8600 W/ AUX' },
                { value: 'CVR_PE8400_PE8600_5CH', label: '5CH Rods: PE8400 / PE8600' },
            ];
        } else if (type === 'SVR') {
            options = [
                { value: 'SVR_2700_3700', label: '2700 / 3700 Series' },
                { value: 'SVR_8700_9700', label: '8700 / 9700 Series' },
                { value: 'SVR_PE8700', label: 'PE8700 Premium' },
            ];
        }
        setSeriesOptions(options);
        setInputs(prev => ({ ...prev, deviceSeries: '' }));

        // Clear measurements based on device type
        if (type === 'Crossbar') {
            setInputs(prev => ({ ...prev, doorHeight: '', aff: '' }));
        } else if (type === 'CVR' || type === 'SVR') {
            setInputs(prev => ({ ...prev, doorWidth: '' }));
        }
    }, []);

    useEffect(() => {
        updateSeriesOptions(inputs.deviceType);
    }, [inputs.deviceType, updateSeriesOptions]);

    const calculateLengths = () => {
        const dh = parseFloat(inputs.doorHeight);
        const aff = parseFloat(inputs.aff);
        const dw = parseFloat(inputs.doorWidth);
        const { deviceType, deviceSeries } = inputs;
        
        let tr = 'N/A';
        let br = 'N/A';
        let re = 'N/A';
        let cb = 'N/A';
        let calcMessage = '';
        let calcIsError = false;

        // --- CROSSBAR CALCULATION ---
        if (!isNaN(dw) && dw > 0) {
            cb = (dw - CONSTANTS.CROSSBAR_STD).toFixed(3);
        } else if (deviceType === 'Crossbar') {
            calcMessage = 'Please enter a valid Door Width for crossbar calculation.';
            calcIsError = true;
        }

        // --- VALIDATION FOR RODS ---
        if (deviceType !== 'Crossbar') {
            if (isNaN(dh) || isNaN(aff) || dh <= 0 || aff <= 0) {
                calcMessage = 'Please enter valid Door Height and AFF measurements for rod calculations.';
                calcIsError = true;
            } else if (!deviceSeries) {
                calcMessage = 'Please select a specific Device Series.';
                calcIsError = true;
            } else if (dh <= aff) {
                calcMessage = 'Door Height must be greater than AFF.';
                calcIsError = true;
            } else {
                // --- ROD CALCULATION LOGIC ---
                const P = CONSTANTS[deviceSeries];
                
                if (deviceSeries.startsWith('CVR')) {
                    const rodLengthPotential = dh - aff - P.DH_OFFSET;
                    
                    if (rodLengthPotential > P.MAX_STD_ROD) {
                        re = (dh - aff - P.RE_OFFSET).toFixed(3);
                        tr = P.TR_STD.toFixed(3);
                    } else {
                        re = '0.000';
                        tr = rodLengthPotential.toFixed(3);
                    }
                    br = (aff - P.BR_OFFSET).toFixed(3);
                    
                } else if (deviceSeries.startsWith('SVR')) {
                    if (deviceSeries === 'SVR_2700_3700') {
                        const rodLengthPotential = dh - aff - P.DH_OFFSET;

                        if (rodLengthPotential > P.MAX_STD_ROD) {
                            re = (dh - aff - P.DH_OFFSET - P.RE_OFFSET).toFixed(3);
                            tr = P.TR_STD.toFixed(3);
                        } else {
                            re = '0.000';
                            tr = rodLengthPotential.toFixed(3);
                        }
                        br = (aff - P.BR_OFFSET).toFixed(3); 
                        
                    } else if (deviceSeries === 'SVR_8700_9700' || deviceSeries === 'SVR_PE8700') {
                        
                        // Check if an extension rod is needed (DH - AFF > 55.000)
                        if (dh - aff > P.MAX_STD_ROD) { 
                            re = P.RE_STD.toFixed(3); // 30.500
                            tr = (dh - aff - P.RE_STD - P.DH_OFFSET - P.TR_ADJ).toFixed(3);
                        } else {
                            re = '0.000';
                            tr = (dh - aff - P.DH_OFFSET).toFixed(3);
                        }
                        br = (aff - P.BR_OFFSET).toFixed(3); // Corrected to use BR_OFFSET 5.000
                    }
                }
                
                if (!calcIsError) {
                    if (parseFloat(tr) <= 0 || parseFloat(br) <= 0) {
                        calcMessage = 'Calculations resulted in a non-positive rod length. Please verify door height, AFF, and device series.';
                        calcIsError = true;
                    } 
                }
            }
        }
        
        if (!calcIsError) {
            calcMessage = 'Calculations complete. Double-check all inputs against the job specifications.';
        }

        setResults({
            topRodLength: tr,
            bottomRodLength: br,
            rodExtension: re,
            crossbarLength: cb,
        });

        setMessage(calcMessage);
        setIsError(calcIsError);
        setIsResultsModalOpen(true);
    };


    return (
        // Modal Wrapper for RodCalculator Input Form (Pure CSS Styling)
        <div 
            className="modal-overlay"
            onClick={onClose} 
        >
            <div 
                className="calculator-modal"
                onClick={e => e.stopPropagation()} 
                role="dialog"
                aria-modal="true"
                aria-labelledby="calculator-title"
            >
                <div className="p-6 md:p-8">

                    <div className="modal-header">
                        <h2 id="calculator-title" className="modal-title">
                            <Calculator className="modal-title-icon" />
                            Rod Length Calculator
                        </h2>
                        <button 
                            onClick={onClose} 
                            className="close-button"
                            aria-label="Close calculator"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <p className="modal-intro-text">
                        Select your exit device type and enter the required measurements in inches.
                    </p>

                    <div className="space-y-6">
                        {/* Device Selection Group */}
                        <div className="input-group device-select-group">
                            <h3 className="group-title">1. Select Device</h3>
                            <div className="form-grid device-grid">
                                <div>
                                    <label htmlFor="deviceType" className="input-label">Device Type</label>
                                    <select 
                                        id="deviceType" 
                                        className="form-select"
                                        value={inputs.deviceType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">-- Select Type --</option>
                                        <option value="CVR">CVR (Concealed Vertical Rod)</option>
                                        <option value="SVR">SVR (Surface Vertical Rod)</option>
                                        <option value="Crossbar">Crossbar Only for 90 series (No Rods)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="deviceSeries" className="input-label">Device Series / Model</label>
                                    <select 
                                        id="deviceSeries" 
                                        className="form-select"
                                        value={inputs.deviceSeries}
                                        onChange={handleInputChange}
                                        disabled={inputs.deviceType === 'Crossbar' || seriesOptions.length === 0}
                                    >
                                        <option value="">-- Select Series --</option>
                                        {seriesOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Measurement Inputs Group (Conditional Rendering Applied Here) */}
                        <div className="input-group measurement-input-group">
                            <h3 className="group-title">2. Enter Measurements (Inches)</h3>
                            <div className="form-grid measurement-grid">
                                {/* Show Door Height and AFF for Rod devices (CVR/SVR) or initial state */}
                                {(inputs.deviceType === 'CVR' || inputs.deviceType === 'SVR' || inputs.deviceType === '') && (
                                    <>
                                        <div>
                                            <label htmlFor="doorHeight" className="input-label">Door Height (DH)</label>
                                            <input 
                                                type="number" step="0.001" id="doorHeight" 
                                                placeholder="e.g., 84.000" 
                                                className="form-input"
                                                value={inputs.doorHeight}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="aff" className="input-label">AFF (Above Finished Floor)</label>
                                            <input 
                                                type="number" step="0.001" id="aff" 
                                                placeholder="e.g., 41.000" 
                                                className="form-input"
                                                value={inputs.aff}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Show Door Width ONLY for Crossbar */}
                                {inputs.deviceType === 'Crossbar' && (
                                    <div>
                                        <label htmlFor="doorWidth" className="input-label">Door Width (DW)</label>
                                        <input 
                                            type="number" step="0.001" id="doorWidth" 
                                            placeholder="e.g., 36.000" 
                                            className="form-input"
                                            value={inputs.doorWidth}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                        
                    <button 
                        onClick={calculateLengths} 
                        className="calculate-button"
                    >
                        Calculate Rod Lengths
                    </button>
                    
                    <p className="note-text">
                        Note: This tool provides cut lengths. Always verify against job specifications.
                    </p>
                </div>
            </div>
            
            {/* The inner result modal */}
            {isResultsModalOpen && results && (
                <ResultModal 
                    results={results} 
                    message={message} 
                    isError={isError} 
                    onClose={() => setIsResultsModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default RodCalculator;