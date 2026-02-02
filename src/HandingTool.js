import React, { useState, useMemo } from 'react';
import { 
    X, RotateCcw, CheckCircle, AlertTriangle, Lock, 
    Video, LogOut, Key, DoorOpen, Maximize2
} from 'lucide-react';
import handingDiagram from './assets/handing.png';
import './HandingTool.css';

// --- DATA: EXIT DEVICE MODELS ---
const EXIT_DEVICE_MODELS = [
    { value: '8300', label: '8300 Series (Mortise)', type: 'HANDED' },
    { value: 'PE8300', label: 'PE8300 Series (Mortise)', type: 'HANDED' },
    { value: '8400', label: '8400 Series (CVR)', type: 'HANDED' },
    { value: 'PE8400', label: 'PE8400 Series (CVR)', type: 'HANDED' },
    { value: '8500', label: '8500 Series (Rim)', type: 'REVERSIBLE' },
    { value: 'PE8500', label: 'PE8500 Series (Rim)', type: 'REVERSIBLE' },
    { value: '8600', label: '8600 Series (C-CVR)', type: 'HANDED' },
    { value: 'PE8600', label: 'PE8600 Series (C-CVR)', type: 'HANDED' },
    { value: '8700', label: '8700 Series (SVR)', type: 'HANDED' },
    { value: 'PE8700', label: 'PE8700 Series (SVR)', type: 'HANDED' },
    { value: '8800', label: '8800 Series (Rim)', type: 'REVERSIBLE' },
    { value: 'PE8800', label: 'PE8800 Series (Rim)', type: 'REVERSIBLE' },
    { value: '8900', label: '8900 Series (Mortise)', type: 'HANDED' },
    { value: 'PE8900', label: 'PE8900 Series (Mortise)', type: 'HANDED' },
    { value: '3828', label: '3828 Series', type: 'REVERSIBLE' },
    { value: '3727', label: '3727 Series', type: 'REVERSIBLE' },
    { value: '2828', label: '2828 Series', type: 'REVERSIBLE' },
    { value: '2727', label: '2727 Series', type: 'REVERSIBLE' }
];

const HandingTool = ({ onClose }) => {
    const [category, setCategory] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // --- LOGIC: DETERMINE HANDING STATUS ---
    const result = useMemo(() => {
        if (!category) return null;

        if (category === 'mortise' || category === 'bored') {
            return {
                status: 'REVERSIBLE',
                title: 'Field Reversible',
                description: 'This product is designed for flexibility. You can easily change the handing in the field without disassembling the main lockbody.',
                color: 'success'
            };
        }

        if (category === 'exit') {
            if (!selectedModel) return null;
            const modelData = EXIT_DEVICE_MODELS.find(m => m.value === selectedModel);
            if (modelData?.type === 'HANDED') {
                return {
                    status: 'HANDED',
                    title: 'Handed (Specify on Order)',
                    description: 'This model is NOT field reversible. You must specify LHR (Left Hand Reverse) or RHR (Right Hand Reverse) when placing your order.',
                    color: 'warning'
                };
            }
            return {
                status: 'REVERSIBLE',
                title: 'Field Reversible',
                description: 'Standard rim devices are reversible. This unit can be re-handed in the field to suit your specific door application.',
                color: 'success'
            };
        }
        return null;
    }, [category, selectedModel]);

    // --- LOGIC: GET RELEVANT VIDEO ---
    const videoData = useMemo(() => {
        if (category === 'mortise') return { url: "https://www.youtube.com/embed/3alaDlEST1k", title: "Mortise Rehanding Guide" };
        if (category === 'exit' && selectedModel) {
            if (selectedModel.startsWith('PE8')) return { url: "https://www.youtube.com/embed/Mm9RR3Q3SCI", title: "PE80 Trim Rehanding" };
            if (selectedModel.startsWith('8')) return { url: "https://www.youtube.com/embed/x8Eq1moV97Y", title: "80 Series Trim Rehanding" };
        }
        return null;
    }, [category, selectedModel]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal handing-modal" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h2 className="modal-title">
                        <RotateCcw className="modal-title-icon" style={{color: '#3b82f6'}} /> 
                        Handing Specialist Tool
                    </h2>
                    <button onClick={onClose} className="close-button" aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    
                    {/* STEP 1: CATEGORY SELECTION */}
                    <div>
                        <h3 className="group-title">1. Select Product Category</h3>
                        <div className="device-type-grid">
                            <button 
                                className={`device-type-btn ${category === 'exit' ? 'active' : ''}`} 
                                onClick={() => { setCategory('exit'); setSelectedModel(''); }}
                            >
                                <LogOut size={28} />
                                <span className="device-label">Exit Device</span>
                                <span className="device-detail">80/90/20/30 Series</span>
                                {category === 'exit' && <CheckCircle size={18} className="device-check" />}
                            </button>
                            
                            <button 
                                className={`device-type-btn ${category === 'mortise' ? 'active' : ''}`} 
                                onClick={() => { setCategory('mortise'); setSelectedModel(''); }}
                            >
                                <Key size={28} />
                                <span className="device-label">Mortise Lock</span>
                                <span className="device-detail">8200 / R8200 Series</span>
                                {category === 'mortise' && <CheckCircle size={18} className="device-check" />}
                            </button>

                            <button 
                                className={`device-type-btn ${category === 'bored' ? 'active' : ''}`} 
                                onClick={() => { setCategory('bored'); setSelectedModel(''); }}
                            >
                                <DoorOpen size={28} />
                                <span className="device-label">Bored Lock</span>
                                <span className="device-detail">10-Line / 11-Line</span>
                                {category === 'bored' && <CheckCircle size={18} className="device-check" />}
                            </button>
                        </div>
                    </div>

                    {/* STEP 2: MODEL SELECTION (Conditional) */}
                    {category === 'exit' && (
                        <div className="fade-in">
                            <h3 className="group-title">2. Select Device Series</h3>
                            <div className="search-container" style={{marginBottom: '0'}}>
                                <select 
                                    className="model-search-input" 
                                    style={{paddingLeft: '1rem', appearance: 'auto', cursor: 'pointer'}}
                                    value={selectedModel} 
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    <option value="">-- Click to choose series --</option>
                                    {EXIT_DEVICE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* RESULTS DISPLAY */}
                    {result && (
                        <div className="results-container fade-in" style={{paddingTop: '0', border: 'none'}}>
                            <div className={`csr-result-card ${result.color === 'success' ? 'top-rod-card' : 'crossbar-card'}`} 
                                 style={{ borderLeftWidth: '5px', padding: '1.5rem' }}>
                                <div className="csr-card-header-left">
                                    {result.color === 'success' ? 
                                        <CheckCircle size={32} color="#10b981"/> : 
                                        <AlertTriangle size={32} color="#f59e0b"/>
                                    }
                                    <div>
                                        <h3 className="csr-name" style={{fontSize: '1.25rem'}}>{result.title}</h3>
                                        <p className="detail-text" style={{color: '#94a3b8', marginTop: '4px'}}>{result.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIDEO & DIAGRAM SECTION */}
                    <div className="parts-grid two-col handing-reference-section fade-in">
                        {/* Visual Reference Diagram */}
                        <div className="part-info-card clickable-diagram-card" onClick={() => setIsImageModalOpen(true)}>
                            <div className="note-header" style={{color: '#3b82f6'}}>
                                <Lock size={18} />
                                <span>VISUAL REFERENCE (Click to Enlarge)</span>
                                <Maximize2 size={14} style={{marginLeft: 'auto', opacity: 0.6}} />
                            </div>
                            <div className="diagram-preview-container">
                                <img src={handingDiagram} alt="Handing Diagram" className="diagram-img" />
                            </div>
                            <p className="detail-text" style={{textAlign: 'center', marginTop: '12px'}}>
                                Always view door from the <strong>Secure Side (Outside)</strong>.
                            </p>
                        </div>

                        {/* Video Tutorial (If available) */}
                        {videoData ? (
                            <div className="part-info-card video-card">
                                <div className="note-header" style={{color: '#f59e0b'}}>
                                    <Video size={18} />
                                    <span>{videoData.title}</span>
                                </div>
                                <div className="video-container">
                                    <iframe 
                                        src={videoData.url} 
                                        title="Tutorial" 
                                        allowFullScreen 
                                        frameBorder="0"
                                        style={{width: '100%', height: '100%'}}
                                    ></iframe>
                                </div>
                            </div>
                        ) : (
                            <div className="part-info-card video-card empty-video">
                                <Video size={32} style={{marginBottom: '10px'}} />
                                <p className="detail-text">Select a specific handed model to view re-handing tutorials.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* FULLSCREEN IMAGE MODAL */}
            {isImageModalOpen && (
                <div className="image-zoom-overlay" onClick={() => setIsImageModalOpen(false)}>
                    <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="zoom-close-btn" onClick={() => setIsImageModalOpen(false)}>
                            <X size={32} />
                        </button>
                        <img src={handingDiagram} alt="Full Handing Diagram" className="full-zoom-img" />
                        <div className="zoom-caption">Handing Reference Diagram - Secure Side (Outside) View</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandingTool;