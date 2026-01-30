import React, { useState, useMemo } from 'react';
import { MapPin, Search, User, Phone, Mail, X, Hash, Check, Info } from 'lucide-react'; 

// --- HELPER: HIGHLIGHTED TEXT ---
const HighlightedText = ({ text, highlightKeywords }) => {
    if (!text) return null;
    if (!highlightKeywords || highlightKeywords.length === 0) {
        return <span>{text}</span>;
    }

    const validKeywords = highlightKeywords.filter(k => k && k.trim().length > 0);
    if (validKeywords.length === 0) return <span>{text}</span>;

    const pattern = validKeywords
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.toString().split(regex);

    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <span key={i} className="highlight-match">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

// --- DATA: STATE DEFINITIONS ---
const STATE_TO_FULL = {
    "AL": "ALABAMA", "AK": "ALASKA", "AZ": "ARIZONA", "AR": "ARKANSAS", "CA": "CALIFORNIA",
    "CO": "COLORADO", "CT": "CONNECTICUT", "DE": "DELAWARE", "DC": "DISTRICT OF COLUMBIA",
    "FL": "FLORIDA", "GA": "GEORGIA", "HI": "HAWAII", "ID": "IDAHO", "IL": "ILLINOIS",
    "IN": "INDIANA", "IA": "IOWA", "KS": "KANSAS", "KY": "KENTUCKY", "LA": "LOUISIANA",
    "ME": "MAINE", "MD": "MARYLAND", "MA": "MASSACHUSETTS", "MI": "MICHIGAN", "MN": "MINNESOTA",
    "MS": "MISSISSIPPI", "MO": "MISSOURI", "MT": "MONTANA", "NE": "NEBRASKA", "NV": "NEVADA",
    "NH": "NEW HAMPSHIRE", "NJ": "NEW JERSEY", "NM": "NEW MEXICO", "NY": "NEW YORK",
    "NC": "NORTH CAROLINA", "ND": "NORTH DAKOTA", "OH": "OHIO", "OK": "OKLAHOMA", "OR": "OREGON",
    "PA": "PENNSYLVANIA", "RI": "RHODE ISLAND", "SC": "SOUTH CAROLINA", "SD": "SOUTH DAKOTA",
    "TN": "TENNESSEE", "TX": "TEXAS", "UT": "UTAH", "VT": "VERMONT", "VA": "VIRGINIA",
    "WA": "WASHINGTON", "WV": "WEST VIRGINIA", "WI": "WISCONSIN", "WY": "WYOMING"
};

// --- DATA: TERRITORY MAP ---
const TERRITORY_DEFINITIONS = {
    "A01": ["CT", "MA", "ME", "NH", "RI", "VT"],
    "A02": ["Upstate NY"],
    "A03": ["Metro NY", "North NJ"],
    "A07": ["South NJ", "PA", "DE"],
    "A08": ["DC", "MD", "VA"],
    "A13": ["NC", "SC", "East TN"],
    "A15": ["FL", "GA"], 
    "A16": ["AL", "West TN"],
    "A21": ["South OH", "South IN", "KY", "WV"],
    "A22": ["MO", "KS", "IA", "NE", "South IL"],
    "A27": ["North TX", "South TX", "OK", "AR", "North LA"],
    "A28": ["South MS", "South LA"],
    "A31": ["MI", "WI", "North IN", "North OH"],
    "A32": ["MN", "ND", "SD", "North IL"],
    "A37": ["AZ", "West TX", "NM"],
    "A38": ["North CA", "North NV"],
    "A39": ["South CA", "South NV", "HI"],
    "A43": ["CO", "UT", "WY", "MT"],
    "A44": ["WA", "OR", "ID", "AK", "North ID"],
    // Distributors / Specifics
    "Canada": ["Canada"], "Intl": ["International"], "Arrow": ["Arrow"],
    "Grainger": ["Grainger"], "Himmels": ["Himmels"], "Banner": ["Banner"],
    "SecLock": ["SecLock"], "Mayflower": ["Mayflower"], "IDN": ["IDN"],
    "Clark": ["Clark"], "Anixter": ["Anixter"], "ADI": ["ADI"],
    "Intermountain": ["Intermountain"], "JLM": ["JLM"], "Akron": ["Akron"],
    "Dugmore": ["Dugmore"], "Norwood": ["Norwood"], "Cleveland": ["Cleveland Vicon"]
};

// --- DATA: CSR LIST ---
const RAW_CSR_DATA = [
    // --- SARGENT ---
    { name: "Miriam Redgate", phone: "(203) 498-5595", email: "miriam.redgate@assaabloy.com", brand: "Sargent", codes: ["A01", "A07", "HI"] },
    { name: "Anne Dempster", phone: "(203) 498-5840", email: "anne.dempster@assaabloy.com", brand: "Sargent", codes: ["A02", "A03", "A08", "Arrow"] },
    { name: "Alyssa Carey", phone: "(203) 498-5531", email: "alyssa.carey@assaabloy.com", brand: "Sargent", codes: ["A21", "A22", "A43", "Grainger", "Cleveland"] },
    { name: "Robin Pascale", phone: "(203) 498-5596", email: "robin.pascale@assaabloy.com", brand: "Sargent", codes: ["A13", "A16", "A31", "A32"] },
    { name: "Shirley Sotaski", phone: "(203) 498-5715", email: "shirley.sotaski@assaabloy.com", brand: "Sargent", codes: ["A27", "A28", "Himmels"] },
    { name: "Janelle Schmittberger", phone: "(203) 498-5693", email: "janelle.schmittberger@assaabloy.com", brand: "Sargent", codes: ["A15", "A37", "A38", "A39"] },
    { name: "Maritza Yugchaoquendo", phone: "(203) 498-5699", email: "maritza.yugchaoquendo@assaabloy.com", brand: "Sargent", codes: ["A44", "Canada", "Intl"] },
    { name: "Patricia Hansen", phone: "(203) 498-5596", email: "patricia.hansen@assaabloy.com", brand: "Sargent", codes: ["Intermountain", "Clark", "Anixter", "ADI", "IDN", "JLM"] },
    { name: "Jennifer Leslie", phone: "(203) 498-5698", email: "jennifer.leslie@assaabloy.com", brand: "Sargent", codes: ["Akron", "Banner", "SecLock", "Norwood", "Dugmore"] },
    // --- CORBIN RUSSWIN ---
    { name: "Amber States", phone: "704-226-6185", email: "amber.states@assaabloy.com", brand: "Corbin Russwin", codes: ["A13", "A21", "A31", "A32", "A43", "A44"] },
    { name: "AnnMarie Jones", phone: "860-828-7265", email: "annmarie.jones@assaabloy.com", brand: "Corbin Russwin", codes: ["A07", "A16", "A28", "A38", "A39"] },
    { name: "Delilah Whitley", phone: "704-226-6168", email: "delilah.whitley@assaabloy.com", brand: "Corbin Russwin", codes: ["A15", "A27", "A37", "Himmels"] },
    { name: "Noel McNeil", phone: "704-226-6123", email: "noel.mcneil@assaabloy.com", brand: "Corbin Russwin", codes: ["A02", "A03", "A08"] },
    { name: "Scott Sullivan", phone: "860-828-7270", email: "scott.sullivan1@assaabloy.com", brand: "Corbin Russwin", codes: ["A01", "A22", "Banner", "SecLock"] },
    // --- ACCENTRA ---
    { name: "Debra D'Arienzo", phone: "855-557-5078 x7218", email: "debra.darienzo@assaabloy.com", brand: "ACCENTRA", codes: ["A13", "A38", "A39", "A44"] },
    { name: "Shanice Ivey", phone: "855-557-5078 x6198", email: "shanice.ivey@assaabloy.com", brand: "ACCENTRA", codes: ["A07", "A08"] },
    { name: "Dedee McClary", phone: "855-557-5078 x6170", email: "dedee.mcclary@assaabloy.com", brand: "ACCENTRA", codes: ["A15", "A16", "A28"] },
    { name: "Laura Moore", phone: "855-557-5078 x6255", email: "laura.moore@assaabloy.com", brand: "ACCENTRA", codes: ["A01", "A22", "A43", "Banner", "SecLock"] },
    { name: "Mary Tarlton", phone: "855-557-5078 x6177", email: "mary.tarlton@assaabloy.com", brand: "ACCENTRA", codes: ["A02", "A03", "A27", "Mayflower", "Himmels"] },
    { name: "Dawn Reynolds", phone: "855-557-5078 7327", email: "dawn.reynolds@assaabloy.com", brand: "ACCENTRA", codes: ["A21", "A31", "A32", "A37"] },
    // --- NORTON RIXSON ---
    { name: "Casie Luther", phone: "(877) 974-2255", email: "casie.luther@assaabloy.com", brand: "Norton Rixson", codes: ["A01", "A21", "A37", "A38", "A39"] },
    { name: "Stacy Staples", phone: "(877) 974-2255", email: "stacy.staples@assaabloy.com", brand: "Norton Rixson", codes: ["A02", "A03", "A07", "A27", "A28"] },
    { name: "Jessica Kennington", phone: "(877) 974-2255", email: "jessica.kennington@assaabloy.com", brand: "Norton Rixson", codes: ["A15", "A16", "A32", "A44", "Intl"] },
    { name: "Crystal Frost", phone: "(877) 974-2255", email: "crystal.frost@assaabloy.com", brand: "Norton Rixson", codes: ["A08", "A13", "A22", "A31", "A43"] },
];

const CsrSearchModal = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All'); 

    // --- 1. DATA PRE-PROCESSING ---
    const processedData = useMemo(() => {
        return RAW_CSR_DATA.map(csr => {
            const regionList = [];
            const allKeywords = [...csr.codes]; 

            csr.codes.forEach(code => {
                if (TERRITORY_DEFINITIONS[code]) {
                    const mappedRegions = TERRITORY_DEFINITIONS[code];
                    regionList.push(...mappedRegions);
                    allKeywords.push(...mappedRegions);

                    mappedRegions.forEach(region => {
                        Object.keys(STATE_TO_FULL).forEach(stateCode => {
                            const regex = new RegExp(`\\b${stateCode}\\b`, 'i');
                            if (regex.test(region)) {
                                allKeywords.push(STATE_TO_FULL[stateCode]);
                            }
                        });
                    });
                } else {
                    regionList.push(code); 
                }
            });

            const uniqueRegions = [...new Set(regionList)];
            return {
                ...csr,
                regionDescription: uniqueRegions.join(", "),
                keywords: allKeywords.map(k => k.toString().toUpperCase()), 
                territoryCodes: csr.codes.join(", ")
            };
        });
    }, []);

    // --- 2. FILTERING & SORTING LOGIC ---
    const results = useMemo(() => {
        // Step A: Brand Filter
        let filtered = processedData;
        if (selectedBrand !== 'All') {
            filtered = filtered.filter(csr => csr.brand === selectedBrand);
        }

        // Step B: Search Term Logic
        if (!searchTerm) {
            if (selectedBrand === 'All') return [];
            return filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        const lowerTerm = searchTerm.toLowerCase().trim();
        const isShortTerm = lowerTerm.length <= 2; 

        // Step C: Search Filtering
        const matches = filtered.filter(csr => {
            const nameMatch = csr.name.toLowerCase().includes(lowerTerm);
            const territoryMatch = csr.keywords.some(k => {
                const lowerK = k.toLowerCase();
                if (isShortTerm) {
                    // STRICT MODE FIX:
                    // 1. "Starts With" covers "Alabama" (AL) or "Louisiana" (L)
                    const startsWith = lowerK.startsWith(lowerTerm);
                    
                    // 2. "Word Boundary" covers "North LA" (LA)
                    const wordBoundary = new RegExp(`\\b${lowerTerm}\\b`, 'i').test(lowerK);

                    // 3. "Code Expansion" covers input "LA" matching "Louisiana" keyword 
                    // (Ensure input "LA" finds "LOUISIANA" even if the keyword list doesn't explicitly have "LA" as a distinct item)
                    let codeExpand = false;
                    const fullState = STATE_TO_FULL[lowerTerm.toUpperCase()];
                    if (fullState && lowerK === fullState.toLowerCase()) {
                        codeExpand = true;
                    }

                    return startsWith || wordBoundary || codeExpand;
                } else {
                    return lowerK.includes(lowerTerm);
                }
            });
            return nameMatch || territoryMatch;
        });

        // Step D: Smart Sorting (Exact matches first)
        return matches.sort((a, b) => {
            const getScore = (csr) => {
                if (csr.keywords.includes(searchTerm.toUpperCase())) return 10; // Exact Code
                if (csr.name.toLowerCase().startsWith(lowerTerm)) return 8; // Name Start
                if (csr.keywords.some(k => k.toLowerCase().startsWith(lowerTerm))) return 5; // State Start
                if (csr.name.toLowerCase().includes(lowerTerm)) return 2; // Name Partial
                return 1;
            };
            return getScore(b) - getScore(a);
        });

    }, [searchTerm, selectedBrand, processedData]);

    // --- 3. HIGHLIGHT LOGIC ---
    const highlightKeywords = useMemo(() => {
        if (!searchTerm) return [];
        const cleanTerm = searchTerm.trim().toUpperCase();
        const keywords = [searchTerm.trim()];

        if (STATE_TO_FULL[cleanTerm]) {
            keywords.push(STATE_TO_FULL[cleanTerm]);
        }

        Object.entries(STATE_TO_FULL).forEach(([code, fullName]) => {
            const isCodeMatch = code === cleanTerm;
            const isNameStart = fullName.startsWith(cleanTerm);
            const isNameInclude = cleanTerm.length > 2 && fullName.includes(cleanTerm);

            if (isCodeMatch || isNameStart || isNameInclude) {
                keywords.push(code);
                keywords.push(fullName);
            }
        });
        return [...new Set(keywords)];
    }, [searchTerm]);

    const brands = ['All', 'Sargent', 'Corbin Russwin', 'ACCENTRA', 'Norton Rixson'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '700px', height: 'auto', maxHeight: '90vh'}}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <MapPin className="modal-title-icon" />
                        Find Your CSR
                    </h2>
                    <button onClick={onClose} className="close-button"><X size={24}/></button>
                </div>
                
                <div className="modal-body">
                    {/* Brand Selector */}
                    <div className="brand-selector-container">
                        <span className="brand-label">Filter by Brand:</span>
                        <div className="brand-chips">
                            {brands.map(brand => (
                                <button 
                                    key={brand}
                                    className={`brand-chip ${selectedBrand === brand ? 'active' : ''} ${brand.replace(/\s+/g, '-').toLowerCase()}`}
                                    onClick={() => setSelectedBrand(brand)}
                                >
                                    {selectedBrand === brand && <Check size={14} style={{marginRight:4}}/>}
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="input-group search-container">
                        <label className="input-label" htmlFor="csr-search">Search by State, Code, Name, or Distributor</label>
                        <div className="search-input-wrapper">
                             <Search className="search-icon-absolute" size={20}/>
                             <input
                                id="csr-search"
                                type="text"
                                className="form-input with-icon"
                                placeholder="e.g. Texas, A27, or Banner..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="csr-results-list">
                        {results.length > 0 ? (
                            results.map((csr, index) => (
                                <div key={`${csr.name}-${index}`} className="csr-result-card">
                                    <div className="csr-card-top-row">
                                        <div className="csr-card-header-left">
                                            <div className="csr-avatar">
                                                <User size={24} color="#fff" />
                                            </div>
                                            <div>
                                                <h3 className="csr-name">{csr.name}</h3>
                                                <div className="csr-code-container">
                                                    <Hash size={12} className="csr-code-icon"/>
                                                    <span className="csr-code-text">
                                                        <HighlightedText text={csr.territoryCodes} highlightKeywords={highlightKeywords} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`brand-badge ${csr.brand.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {csr.brand}
                                        </div>
                                    </div>
                                    
                                    <div className="csr-region-block">
                                        <p className="csr-region-label">Territory Coverage:</p>
                                        <p className="csr-region-text">
                                            <HighlightedText text={csr.regionDescription} highlightKeywords={highlightKeywords} />
                                        </p>
                                    </div>

                                    <div className="csr-contact-actions">
                                        <a href={`tel:${csr.phone}`} className="csr-action-btn">
                                            <Phone size={16} /> {csr.phone}
                                        </a>
                                        <a href={`mailto:${csr.email}`} className="csr-action-btn secondary">
                                            <Mail size={16} /> {csr.email}
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-result-box">
                                {selectedBrand === 'All' && !searchTerm ? (
                                    <div className="empty-state">
                                        <Info size={40} className="empty-icon"/>
                                        <p>Select a brand to view all specialists, or type a location.</p>
                                    </div>
                                ) : (
                                    <>
                                        <p>No matches found for "{searchTerm}" in {selectedBrand}.</p>
                                        <p className="sub-text">Please try a State Code (e.g. "TX") or check spelling.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsrSearchModal;