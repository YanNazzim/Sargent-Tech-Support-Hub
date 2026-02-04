/* src/CsrSearchModal.js */
import React, { useState, useMemo } from 'react';
import { MapPin, Search, Phone, Mail, X, Check, Info } from 'lucide-react'; 
import './CsrSearchModal.css'; 

// --- HELPER: HIGHLIGHT COMPONENT ---
const HighlightedText = ({ text, highlightKeywords }) => {
    if (!text) return null;
    if (!highlightKeywords || highlightKeywords.length === 0) return <span>{text}</span>;

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

// --- DATA CONSTANTS ---
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

const TERRITORY_DEFINITIONS = {
    // --- STANDARD / LEGACY DEFINITIONS (Corbin, ACC, Norton) ---
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
    
    // --- SARGENT SPECIFIC DEFINITIONS (Updated 03-25-2025) ---
    "SGT_A01": ["CT", "ME", "MA", "NH", "VT", "RI"],
    "SGT_A02_A03": ["NY", "NJ"],
    "SGT_A07": ["DE", "PA", "WV"], // WV moved here from A21
    "SGT_A08": ["VA", "MD", "DC"],
    "SGT_A13": ["NC", "SC"], // TN removed
    "SGT_A15": ["FL"], // GA removed
    "SGT_A16": ["AL", "MS", "TN"], // MS added (from A28), TN unified
    "SGT_GA": ["GA"], // Georgia separated (Janelle)
    "SGT_A21": ["South IN", "KY", "MO", "OH"], // MO added, WV removed, OH unified
    "SGT_A22": ["IA", "KS", "NE"], // MO removed
    "SGT_A27": ["AR", "TX", "OK"], // LA removed, TX unified
    "SGT_A28": ["TX", "LA"], // MS removed, TX added
    "SGT_A31": ["North IN"], // MI/WI moved to A32
    "SGT_A32": ["MI", "MN", "ND", "SD", "WI", "IL"], // MI, WI, IL added
    "SGT_A37": ["AZ", "NM"], 
    "SGT_A38": ["CA", "NV"], // Full CA/NV coverage
    "SGT_A39": ["South CA"],
    "SGT_A43": ["CO", "MT", "UT", "WY"], // ID added
    "SGT_A44": ["AK", "OR", "WA", "ID"], 
    "SGT_A45": ["HI"],

    // --- WHOLESALE / SPECIAL ---
    "Canada": ["Canada"], "Intl": ["International"], "Arrow": ["Arrow"],
    "Grainger": ["Grainger"], "Himmels": ["Himmels"], "Banner": ["Banner"],
    "SecLock": ["SecLock"], "Mayflower": ["Mayflower"], "IDN": ["IDN"],
    "Clark": ["Clark"], "Anixter": ["Anixter"], "ADI": ["ADI"],
    "Intermountain": ["Intermountain"], "JLM": ["JLM"], "Akron": ["Akron"],
    "Dugmore": ["Dugmore"], "Norwood": ["Norwood"], "Cleveland": ["Cleveland Vicon"]
};

const RAW_CSR_DATA = [
    // --- SARGENT UPDATES (Source: 03-25-2025 CSV) ---
    { 
        name: "Miriam Redgate", 
        phone: "(203) 498-5595", 
        email: "miriam.redgate@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A01", "SGT_A07", "SGT_A45", "Corbin Russwin Back up"] 
    },
    { 
        name: "Anne Dempster", 
        phone: "(203) 498-5840", 
        email: "anne.dempster@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A02_A03", "SGT_A08", "Arrow", "Medeco"] 
    },
    { 
        name: "Alyssa Carey", 
        phone: "(203) 498-5531", 
        email: "alyssa.carey@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A21", "SGT_A22", "SGT_A43", "Grainger", "Lyons Industries", "Safety Storage", "Security Door", "Savage Doorway"] 
    },
    { 
        name: "Robin Pascale", 
        phone: "(203) 498-5596", 
        email: "robin.pascale@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A16", "SGT_A13", "SGT_A31", "SGT_A32", "Ohio Stafford", "Lazzaro", "Allied Door", "Midwest Security", "Builders Enterprise"] 
    },
    { 
        name: "Shirley Sotaski", 
        phone: "(203) 498-5715", 
        email: "shirley.sotaski@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A27", "SGT_A28", "Himmels", "Persona", "EAC", "Accentra", "Ameristar", "Royal Arch"] 
    },
    { 
        name: "Janelle Schmittberger", 
        phone: "(203) 498-5693", 
        email: "janelle.schmittberger@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A15", "SGT_GA", "SGT_A37", "SGT_A38", "SGT_A39", "Ceco Door", "HES", "Curries", "Assa Abloy Entrance Systems"] 
    },
    { 
        name: "Maritza Yugchaoquendo", 
        phone: "(203) 498-5699", 
        email: "maritza.yugchaoquendo@assaabloy.com", 
        brand: "Sargent", 
        codes: ["SGT_A44", "Canada", "Intl", "ADI (BACKUP ONLY)"] 
    },
    { 
        name: "Patricia Hansen", 
        phone: "(203) 498-5596", 
        email: "patricia.hansen@assaabloy.com", 
        brand: "Sargent", 
        codes: ["Intermountain", "Clark", "Anixter", "ADI", "IDN", "JLM", "Top Notch", "Southern Lock", "Accredited Lock"] 
    },
    { 
        name: "Jennifer Leslie", 
        phone: "(203) 498-5698", 
        email: "jennifer.leslie@assaabloy.com", 
        brand: "Sargent", 
        codes: ["Akron", "Banner", "SecLock", "Norwood", "Dugmore", "Midwest Wholesale"] 
    },

    // --- OTHER BRANDS (Kept as Original) ---
    { name: "Amber States", phone: "704-226-6185", email: "amber.states@assaabloy.com", brand: "Corbin Russwin", codes: ["A13", "A21", "A31", "A32", "A43", "A44"] },
    { name: "AnnMarie Jones", phone: "860-828-7265", email: "annmarie.jones@assaabloy.com", brand: "Corbin Russwin", codes: ["A07", "A16", "A28", "A38", "A39"] },
    { name: "Delilah Whitley", phone: "704-226-6168", email: "delilah.whitley@assaabloy.com", brand: "Corbin Russwin", codes: ["A15", "A27", "A37", "Himmels"] },
    { name: "Noel McNeil", phone: "704-226-6123", email: "noel.mcneil@assaabloy.com", brand: "Corbin Russwin", codes: ["A02", "A03", "A08"] },
    { name: "Scott Sullivan", phone: "860-828-7270", email: "scott.sullivan1@assaabloy.com", brand: "Corbin Russwin", codes: ["A01", "A22", "Banner", "SecLock"] },
    { name: "Debra D'Arienzo", phone: "855-557-5078 x7218", email: "debra.darienzo@assaabloy.com", brand: "ACCENTRA", codes: ["A13", "A38", "A39", "A44"] },
    { name: "Shanice Ivey", phone: "855-557-5078 x6198", email: "shanice.ivey@assaabloy.com", brand: "ACCENTRA", codes: ["A07", "A08"] },
    { name: "Dedee McClary", phone: "855-557-5078 x6170", email: "dedee.mcclary@assaabloy.com", brand: "ACCENTRA", codes: ["A15", "A16", "A28"] },
    { name: "Laura Moore", phone: "855-557-5078 x6255", email: "laura.moore@assaabloy.com", brand: "ACCENTRA", codes: ["A01", "A22", "A43", "Banner", "SecLock"] },
    { name: "Mary Tarlton", phone: "855-557-5078 x6177", email: "mary.tarlton@assaabloy.com", brand: "ACCENTRA", codes: ["A02", "A03", "A27", "Mayflower", "Himmels"] },
    { name: "Dawn Reynolds", phone: "855-557-5078 7327", email: "dawn.reynolds@assaabloy.com", brand: "ACCENTRA", codes: ["A21", "A31", "A32", "A37"] },
    { name: "Casie Luther", phone: "(877) 974-2255", email: "casie.luther@assaabloy.com", brand: "Norton Rixson", codes: ["A01", "A21", "A37", "A38", "A39"] },
    { name: "Stacy Staples", phone: "(877) 974-2255", email: "stacy.staples@assaabloy.com", brand: "Norton Rixson", codes: ["A02", "A03", "A07", "A27", "A28"] },
    { name: "Jessica Kennington", phone: "(877) 974-2255", email: "jessica.kennington@assaabloy.com", brand: "Norton Rixson", codes: ["A15", "A16", "A32", "A44", "Intl"] },
    { name: "Crystal Frost", phone: "(877) 974-2255", email: "crystal.frost@assaabloy.com", brand: "Norton Rixson", codes: ["A08", "A13", "A22", "A31", "A43"] },
];

const CsrSearchModal = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All'); 

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
                        Object.entries(STATE_TO_FULL).forEach(([stCode, stFull]) => {
                            if (new RegExp(`\\b${stCode}\\b`, 'i').test(region)) {
                                allKeywords.push(stFull);
                            }
                        });
                    });
                } else {
                    regionList.push(code); 
                }
            });

            return {
                ...csr,
                regionDescription: [...new Set(regionList)].join(", "),
                keywords: [...new Set(allKeywords)].map(k => k.toString().toUpperCase())
            };
        });
    }, []);

    const highlightKeywords = useMemo(() => {
        if (!searchTerm) return [];
        const cleanTerm = searchTerm.trim().toUpperCase();
        const keywords = [searchTerm.trim()];

        if (STATE_TO_FULL[cleanTerm]) {
            keywords.push(STATE_TO_FULL[cleanTerm]); 
        }

        Object.entries(STATE_TO_FULL).forEach(([code, fullName]) => {
            if (fullName.startsWith(cleanTerm)) {
                keywords.push(code);
            }
        });

        return [...new Set(keywords)];
    }, [searchTerm]);

    const results = useMemo(() => {
        let filtered = processedData;
        if (selectedBrand !== 'All') {
            filtered = filtered.filter(csr => csr.brand === selectedBrand);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase().trim();
            const safeTerm = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Updated regex: Allows match at start of string (^), after whitespace (\s), 
            // after underscore (_), or after hyphen (-).
            // This ensures searching "A32" will match "SGT_A32" or "SGT-A32".
            const wordStartRegex = new RegExp(`(^|[\\s_\\-])${safeTerm}`, 'i');

            filtered = filtered.filter(csr => {
                const nameMatch = csr.name.toLowerCase().includes(lowerTerm);
                const keywordMatch = csr.keywords.some(k => wordStartRegex.test(k));
                return nameMatch || keywordMatch;
            });
        }

        // SORTING PRIORITY: Sargent First, then Alphabetical
        return filtered.sort((a, b) => {
            if (a.brand === 'Sargent' && b.brand !== 'Sargent') return -1;
            if (a.brand !== 'Sargent' && b.brand === 'Sargent') return 1;
            return a.name.localeCompare(b.name);
        });

    }, [searchTerm, selectedBrand, processedData]);

    const brands = ['All', 'Sargent', 'Corbin Russwin', 'ACCENTRA', 'Norton Rixson'];

    return (
        <div className="csr-modal-overlay" onClick={onClose}>
            <div className="csr-modal-content" onClick={e => e.stopPropagation()}>
                
                <div className="csr-header">
                    <div className="csr-title-row">
                        <MapPin size={28} color="#3b82f6" />
                        <h2 className="csr-title">Find Your CSR</h2>
                    </div>
                    <button onClick={onClose} className="csr-close-btn"><X size={24}/></button>
                </div>

                <div className="csr-controls">
                    <div className="brand-chips-row">
                        {brands.map(brand => (
                            <button 
                                key={brand}
                                className={`brand-chip ${selectedBrand === brand ? `active ${brand.replace(/\s+/g, '-').toLowerCase()}` : ''}`}
                                onClick={() => setSelectedBrand(brand)}
                            >
                                {selectedBrand === brand && <Check size={14} strokeWidth={3} />}
                                {brand}
                            </button>
                        ))}
                    </div>

                    <div className="csr-search-wrapper">
                        <Search className="csr-search-icon" size={20}/>
                        <input
                            type="text"
                            className="csr-search-input"
                            placeholder="Search by Name, State (e.g. Texas or TX), Code..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="csr-body">
                    <div className="csr-grid">
                        {results.length > 0 ? (
                            results.map((csr, idx) => (
                                <div key={idx} className="csr-card" data-brand={csr.brand}>
                                    
                                    <div className="csr-card-header">
                                        <div className="csr-info">
                                            <div className="csr-avatar">
                                                {csr.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="csr-name">
                                                    <HighlightedText text={csr.name} highlightKeywords={highlightKeywords}/>
                                                </h3>
                                                {/* Explicit Territory Codes Display */}
                                                <div className="csr-territory-codes">
                                                    {csr.codes.map((code, cIdx) => (
                                                        <span key={cIdx} className="territory-code-tag">
                                                            <HighlightedText text={code} highlightKeywords={highlightKeywords} />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Repositioned Brand Badge */}
                                        <div className="csr-brand-badge top-right">{csr.brand}</div>
                                    </div>

                                    <div className="csr-territory">
                                        <span className="csr-label">States Covered</span>
                                        <p className="csr-text">
                                            <HighlightedText text={csr.regionDescription} highlightKeywords={highlightKeywords} />
                                        </p>
                                    </div>

                                    <div className="csr-contacts">
                                        <a href={`tel:${csr.phone}`} className="contact-btn phone">
                                            <Phone size={16} /> {csr.phone}
                                        </a>
                                        <a href={`mailto:${csr.email}`} className="contact-btn email">
                                            <Mail size={16} /> Email
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
                                <Info size={48} style={{marginBottom: '1rem', opacity: 0.5}}/>
                                <p>No specialists found for "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CsrSearchModal;