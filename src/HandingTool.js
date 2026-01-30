import React, { useState, useMemo } from 'react';
import { X, RotateCcw, CheckCircle, AlertTriangle, Lock, Video } from 'lucide-react';
import handingDiagram from './assets/handing.png';

// --- DATA: HANDING LOGIC DEFINITIONS ---
const DEVICE_CATEGORIES = [
    { id: 'exit', label: 'Exit Devices' },
    { id: 'mortise', label: 'Mortise Locks' },
    { id: 'bored', label: 'Bored Locks' }
];

// Explicit Model Lists based on your specific rules
// 80 Series Handed: 83, 84, 86, 87, 89 (Applies to PE prefixes too)
// 80 Series Reversible: 85, 88
// 30 & 20 Series: Reversible
const EXIT_DEVICE_MODELS = [
    // --- 80 Series & PE80 Series ---
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
    
    // --- 30 Series (Reversible) ---
    { value: '3828', label: '3828 Series', type: 'REVERSIBLE' },
    { value: '3727', label: '3727 Series', type: 'REVERSIBLE' },

    // --- 20 Series (Reversible) ---
    { value: '2828', label: '2828 Series', type: 'REVERSIBLE' },
    { value: '2727', label: '2727 Series', type: 'REVERSIBLE' }
];

const HandingTool = ({ onClose }) => {
    const [category, setCategory] = useState('');
    const [selectedModel, setSelectedModel] = useState('');

    // --- LOGIC: DETERMINE RESULT ---
    const result = useMemo(() => {
        if (!category) return null;

        // Rule: All Mortise and Bored locks are reversible
        if (category === 'mortise' || category === 'bored') {
            return {
                status: 'REVERSIBLE',
                title: 'Field Reversible',
                description: 'This lock can be easily changed in the field to fit Left or Right Hand doors without disassembling the chassis.',
                color: 'success'
            };
        }

        // Rule: Exit Devices depend on the specific model
        if (category === 'exit') {
            if (!selectedModel) return null; // Waiting for model selection

            const modelData = EXIT_DEVICE_MODELS.find(m => m.value === selectedModel);
            
            if (modelData?.type === 'HANDED') {
                return {
                    status: 'HANDED',
                    title: 'Handed (Specify Order)',
                    description: 'This device is NOT reversible. You must specify LHR (Left Hand Reverse) or RHR (Right Hand Reverse) when ordering.',
                    color: 'warning'
                };
            } else {
                return {
                    status: 'REVERSIBLE',
                    title: 'Field Reversible',
                    description: 'This exit device can be re-handed in the field to suit your application.',
                    color: 'success'
                };
            }
        }
        return null;
    }, [category, selectedModel]);

    // --- LOGIC: GET VIDEO TUTORIAL ---
    const videoData = useMemo(() => {
        if (category === 'mortise') {
            return {
                url: "https://www.youtube.com/embed/3alaDlEST1k?si=W0vN8-F0tiTBgK_o",
                title: "How to Rehand Mortise Lock"
            };
        }
        
        if (category === 'exit' && selectedModel) {
            // Check for PE80 Series (Starts with PE8)
            if (selectedModel.startsWith('PE8')) {
                return {
                    url: "https://www.youtube.com/embed/Mm9RR3Q3SCI?si=4tPXU4Qj2uE8BGYK",
                    title: "Rehanding PE80 Series Outside Trim"
                };
            }
            // Check for 80 Series (Starts with 8)
            if (selectedModel.startsWith('8')) {
                return {
                    url: "https://www.youtube.com/embed/x8Eq1moV97Y?si=TizDZdPoUYW7ad8d",
                    title: "Rehanding 80 Series Outside Trim"
                };
            }
        }
        return null;
    }, [category, selectedModel]);

    // Reset model if category changes
    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
        setSelectedModel('');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <RotateCcw className="modal-title-icon" />
                        Handing Determinator
                    </h2>
                    <button onClick={onClose} className="close-button" aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* --- INPUT SECTION --- */}
                    <div className="input-group-wrapper" style={{ marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="category-select">1. Select Product Category</label>
                            <select 
                                id="category-select" 
                                className="form-select" 
                                value={category} 
                                onChange={handleCategoryChange}
                            >
                                <option value="">-- Choose Category --</option>
                                {DEVICE_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Show Model Select ONLY for Exit Devices */}
                        {category === 'exit' && (
                            <div className="input-group fade-in">
                                <label className="input-label" htmlFor="model-select">2. Select Device Series</label>
                                <select 
                                    id="model-select" 
                                    className="form-select" 
                                    value={selectedModel} 
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    <option value="">-- Choose Series --</option>
                                    {EXIT_DEVICE_MODELS.map(model => (
                                        <option key={model.value} value={model.value}>{model.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* --- RESULT SECTION --- */}
                    {result && (
                        <div className={`csr-result-card fade-in`} style={{ 
                            borderLeft: `5px solid ${result.color === 'success' ? '#10b981' : '#f59e0b'}`,
                            background: result.color === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                            marginBottom: '2rem'
                        }}>
                            <div className="csr-card-top-row" style={{ marginBottom: '0.5rem' }}>
                                <div className="csr-card-header-left">
                                    {result.color === 'success' ? (
                                        <CheckCircle size={32} color="#10b981" />
                                    ) : (
                                        <AlertTriangle size={32} color="#f59e0b" />
                                    )}
                                    <div>
                                        <h3 className="csr-name" style={{ fontSize: '1.5rem' }}>{result.title}</h3>
                                        <p className="csr-region-label" style={{ marginTop: '0.25rem' }}>Status</p>
                                    </div>
                                </div>
                            </div>
                            <p className="csr-region-text" style={{ fontSize: '1rem' }}>
                                {result.description}
                            </p>
                        </div>
                    )}

                    {/* --- VIDEO TUTORIAL SECTION --- */}
                    {videoData && (
                        <div className="fade-in" style={{ marginBottom: '2rem' }}>
                            <h4 className="group-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Video size={16} /> {videoData.title}
                            </h4>
                            <div style={{ 
                                position: 'relative', 
                                paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
                                height: 0, 
                                overflow: 'hidden', 
                                borderRadius: '8px',
                                border: '1px solid #333'
                            }}>
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={videoData.url} 
                                    title="YouTube video player" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerPolicy="strict-origin-when-cross-origin" 
                                    allowFullScreen
                                    style={{ position: 'absolute', top: 0, left: 0 }}
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {/* --- VISUAL REFERENCE --- */}
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                        <h4 className="group-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={16} /> Reference Diagram
                        </h4>
                        <div style={{ background: '#fff', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                            <img 
                                src={handingDiagram} 
                                alt="Door Handing Diagram" 
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} 
                            />
                        </div>
                        <p className="note-text" style={{ marginTop: '1rem' }}>
                            Always view the door from the <strong>Outside (Secure Side)</strong> when determining handing for keyed locks.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HandingTool;