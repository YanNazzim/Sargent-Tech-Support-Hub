import React, { useState, useMemo } from 'react';
import './App.css'; // Global dark theme styles
import placeholder from './assets/placeholder.jpg';
import RodCalculator from './RodCalculator';
import HandingTool from './HandingTool';
import RailCalculator from './RailCalculator';

// Icons 
import { Settings, Wrench, Lock, Ruler, Info, MapPin, Search, User, Phone, Mail, X, Hash, Check, RotateCcw, Scissors } from 'lucide-react'; 

// Map product ID to Lucide icon for a richer visual
const productIcons = {
  1: Settings, 
  2: Wrench, 
  3: Ruler, 
  4: Lock, 
  5: Scissors, // Icon for Rail Calculator
  6: RotateCcw, // Icon for Handing Tool
  7: Info, 
  8: Info, 
  9: MapPin, // Icon for CSR Tool
};

// --- HELPER: HIGHLIGHTED TEXT ---
const HighlightedText = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) {
        return <span>{text}</span>;
    }
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
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

// --- DATA: STATE NAME EXPANSION ---
// Ensures searching "Texas" finds "TX", "Ohio" finds "OH", etc.
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

// --- DATA: MASTER TERRITORY MAP ---
// Maps A-Codes to specific states/regions based on the "Split States" CSV
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
    // Brand Specific / Distributors
    "Canada": ["Canada"],
    "Intl": ["International"],
    "Arrow": ["Arrow"],
    "Grainger": ["Grainger"],
    "Himmels": ["Himmels"],
    "Banner": ["Banner"],
    "SecLock": ["SecLock"],
    "Mayflower": ["Mayflower"],
    "IDN": ["IDN"],
    "Clark": ["Clark"],
    "Anixter": ["Anixter"],
    "ADI": ["ADI"],
    "Intermountain": ["Intermountain"],
    "JLM": ["JLM"],
    "Akron": ["Akron"],
    "Dugmore": ["Dugmore"],
    "Norwood": ["Norwood"]
};

// --- DATA: CSR RAW DATA ---
const RAW_CSR_DATA = [
    // --- SARGENT ---
    { name: "Miriam Redgate", phone: "(203) 498-5595", email: "miriam.redgate@assaabloy.com", brand: "Sargent", codes: ["A01", "A07", "HI"] },
    { name: "Anne Dempster", phone: "(203) 498-5840", email: "anne.dempster@assaabloy.com", brand: "Sargent", codes: ["A02", "A03", "A08", "Arrow"] },
    { name: "Alyssa Carey", phone: "(203) 498-5531", email: "alyssa.carey@assaabloy.com", brand: "Sargent", codes: ["A21", "A22", "A43", "Grainger"] },
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

// --- COMPONENTS ---

const ProductCard = ({ title, description, url, onClick, id }) => {
  const Icon = productIcons[id] || Settings; 
  const CardContent = (
    <div className="product-card">
      <div className="card-icon-container">
        <Icon className="card-icon" aria-hidden="true" />
      </div>
      <div className="card-text-content">
          <h3 className="card-title">{title}</h3>
          <p className="card-description">{description}</p>
      </div>
      <div className="card-button-container">
        <span className="card-button">
          {url ? 'Launch Tool' : 'Open Tool'}
        </span>
      </div>
    </div>
  );
  if (url) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="product-card-link">{CardContent}</a>;
  } else if (onClick) {
    return <div onClick={onClick} className="product-card-div">{CardContent}</div>;
  }
  return <div className="product-card-div">{CardContent}</div>;
};

// --- CSR SEARCH MODAL ---
const CsrSearchModal = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All'); 

    // Process Data: Expand A-Codes into full state lists AND expand State Codes to Full Names
    const processedData = useMemo(() => {
        return RAW_CSR_DATA.map(csr => {
            const regionList = [];
            const allKeywords = [...csr.codes]; 

            csr.codes.forEach(code => {
                if (TERRITORY_DEFINITIONS[code]) {
                    const mappedRegions = TERRITORY_DEFINITIONS[code];
                    regionList.push(...mappedRegions);
                    allKeywords.push(...mappedRegions);

                    // --- KEY CHANGE: Expand Codes to Full Names (TX -> TEXAS) ---
                    mappedRegions.forEach(region => {
                        // Region might be "North TX", "South OH", or just "CT"
                        // We check if the region contains a state code
                        Object.keys(STATE_TO_FULL).forEach(stateCode => {
                            // Check for exact match or word boundary match (e.g. "North TX" contains "TX")
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

    // Filter Logic
    const results = useMemo(() => {
        let filtered = processedData;

        if (selectedBrand !== 'All') {
            filtered = filtered.filter(csr => csr.brand === selectedBrand);
        }

        if (!searchTerm) return []; 
        const lowerTerm = searchTerm.toLowerCase().trim();

        return filtered.filter(csr => 
            csr.name.toLowerCase().includes(lowerTerm) || 
            csr.territoryCodes.toLowerCase().includes(lowerTerm) ||
            csr.keywords.some(k => k.toLowerCase().includes(lowerTerm))
        );
    }, [searchTerm, selectedBrand, processedData]);

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
                        {searchTerm && results.length > 0 ? (
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
                                                        <HighlightedText text={csr.territoryCodes} highlight={searchTerm} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Brand Badge (Top Right) */}
                                        <div className={`brand-badge ${csr.brand.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {csr.brand}
                                        </div>
                                    </div>
                                    
                                    <div className="csr-region-block">
                                        <p className="csr-region-label">Territory Coverage:</p>
                                        <p className="csr-region-text">
                                            <HighlightedText text={csr.regionDescription} highlight={searchTerm} />
                                        </p>
                                    </div>

                                    <div className="csr-contact-actions">
                                        <a href={`tel:${csr.phone}`} className="csr-action-btn">
                                            <Phone size={16} /> {csr.phone}
                                        </a>
                                        <a href={`mailto:${csr.email}`} className="csr-action-btn secondary">
                                            <Mail size={16} /> Email Support
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : searchTerm ? (
                            <div className="no-result-box">
                                <p>No direct match found for "{searchTerm}" in {selectedBrand === 'All' ? 'any brand' : selectedBrand}.</p>
                                <p className="sub-text">Please try a State Code (e.g. "TX") or verify the brand filter.</p>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Info size={40} className="empty-icon"/>
                                <p>Select a brand and enter a location to find your specialist.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [isRodCalculatorOpen, setIsRodCalculatorOpen] = useState(false);
  const [isCsrSearchOpen, setIsCsrSearchOpen] = useState(false);
  const [isHandingToolOpen, setIsHandingToolOpen] = useState(false);
  const [isRailCalculatorOpen, setIsRailCalculatorOpen] = useState(false);

  const products = [
    { id: 1, title: 'Templates Lookup Tool', description: "Streamlines your search for templates, making it easy to get exactly what you need.", url: 'https://sargent-templates.netlify.app/' },
    { id: 2, title: 'Parts Lookup Tool', description: "Effortlessly find the right parts with precise information, saving you time and hassle.", url: 'https://sargent-parts.netlify.app/' },
    { id: 9, title: 'Find Your CSR', description: "Locate Customer Support Specialists for Sargent, Corbin Russwin, ACCENTRA, and Norton Rixson.", onClick: () => setIsCsrSearchOpen(true) },
    { id: 3, title: 'Rod Length Calculator', description: "Precisely calculate Top Rod, Bottom Rod, and Rod Extension lengths for SVR and CVR exit devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { id: 5, title: 'Rail Length Calculator', description: "Determine uncut and cut rail lengths for 80 Series and PE80 Series Exit Devices based on door width.", onClick: () => setIsRailCalculatorOpen(true) },
    { id: 6, title: 'Handing Tool', description: "Visually determine the correct left or right handing for door locks, ensuring a precise and proper installation.", onClick: () => setIsHandingToolOpen(true) },
    { id: 4, title: 'Cylinders Tool', description: "Explains how door lock cylinders work and provides a visual breakdown of their individual components.", url: 'https://sargent-cylinders.netlify.app/' },
    { id: 7, title: 'General Product Information', description: "Your go-to resource for learning all about our product, its features, and benefits.", url: 'https://sargent-info.netlify.app/' },
    { id: 8, title: 'Sargent Product Quiz', description: "Test your knowledge of Sargent Hardware and products with this interactive quiz.", url: 'https://sargent-quiz.netlify.app/' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="max-w-7xl header-content">
            <a href='https://www.sargentlock.com/' target="_blank" rel="noopener noreferrer" aria-label="Go to Sargent website">
              <img src={placeholder} className="header-logo" alt="Sargent logo" />
            </a>
        </div>
      </header>

      <div className="max-w-7xl content-wrapper">
        <div className="section-title-container">
            <p className="section-tag">Interactive Tools & Resources</p>
            <h2 className="section-title">Technical Support Gateway</h2>
        </div>
        
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id} 
              title={product.title}
              description={product.description}
              url={product.url}
              onClick={product.onClick}
            />
          ))}
        </div>
      </div>

      {isRodCalculatorOpen && <RodCalculator onClose={() => setIsRodCalculatorOpen(false)} />}
      {isCsrSearchOpen && <CsrSearchModal onClose={() => setIsCsrSearchOpen(false)} />}
      {isHandingToolOpen && <HandingTool onClose={() => setIsHandingToolOpen(false)} />}
      {isRailCalculatorOpen && <RailCalculator onClose={() => setIsRailCalculatorOpen(false)} />}
    </div>
  );
};

export default App;