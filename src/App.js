import React, { useState, useMemo } from 'react';
import './App.css'; // Global dark theme styles
import placeholder from './assets/placeholder.jpg';
import RodCalculator from './RodCalculator';

// Icons (Removed 'ArrowRight' to fix the compilation warning)
import { Settings, Wrench, Lock, DoorOpen, Ruler, Info, MapPin, Search, User, Phone, Mail, X } from 'lucide-react'; 

// Map product ID to Lucide icon for a richer visual
const productIcons = {
  1: Settings, 
  2: Wrench, 
  3: Ruler, 
  4: Lock, 
  5: DoorOpen, 
  6: DoorOpen, 
  7: Info, 
  8: Info, 
  9: MapPin, // Icon for CSR Tool
};

// --- COMPONENTS ---

// ProductCard Component
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
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="product-card-link">
        {CardContent}
      </a>
    );
  } else if (onClick) {
    return (
      <div 
        onClick={onClick} 
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
        role="button"
        tabIndex="0"
        className="product-card-div"
      >
        {CardContent}
      </div>
    );
  }
  return <div className="product-card-div">{CardContent}</div>;
};

// CSR Search Modal Component
const CsrSearchModal = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Data derived from SARGENT Customer Relations Sheet
    const csrData = useMemo(() => [
        {
            id: 'miriam',
            name: "Miriam Redgate",
            phone: "(203) 498-5595",
            email: "miriam.redgate@assaabloy.com",
            regionDescription: "New England, Tri-State, Hawaii",
            keywords: ["CT", "CONNECTICUT", "MA", "MASSACHUSETTS", "ME", "MAINE", "NH", "NEW HAMPSHIRE", "RI", "RHODE ISLAND", "VT", "VERMONT", "NJ", "NEW JERSEY", "PA", "PENNSYLVANIA", "DE", "DELAWARE", "HI", "HAWAII", "A01", "A07"]
        },
        {
            id: 'anne',
            name: "Anne Dempster",
            phone: "(203) 498-5840",
            email: "anne.dempster@assaabloy.com",
            regionDescription: "Upstate NY, Metro NY, Chesapeake, Arrow",
            keywords: ["NY", "NEW YORK", "MD", "MARYLAND", "VA", "VIRGINIA", "DC", "DISTRICT OF COLUMBIA", "ARROW", "A02", "A03", "A08"]
        },
        {
            id: 'alyssa',
            name: "Alyssa Carey",
            phone: "(203) 498-5531",
            email: "alyssa.carey@assaabloy.com",
            regionDescription: "Mid America, Mid Continent, Rockies, Grainger",
            keywords: ["OH", "OHIO", "KY", "KENTUCKY", "WV", "WEST VIRGINIA", "IN", "INDIANA", "IL", "ILLINOIS", "MO", "MISSOURI", "KS", "KANSAS", "IA", "IOWA", "NE", "NEBRASKA", "CO", "COLORADO", "UT", "UTAH", "WY", "WYOMING", "MT", "MONTANA", "GRAINGER", "A21", "A22", "A43"]
        },
        {
            id: 'robin',
            name: "Robin Pascale",
            phone: "(203) 498-5596",
            email: "robin.pascale@assaabloy.com",
            regionDescription: "Carolinas, South, North Shores/Central",
            keywords: ["NC", "NORTH CAROLINA", "SC", "SOUTH CAROLINA", "TN", "TENNESSEE", "AL", "ALABAMA", "MI", "MICHIGAN", "WI", "WISCONSIN", "MN", "MINNESOTA", "ND", "NORTH DAKOTA", "SD", "SOUTH DAKOTA", "A13", "A16", "A31", "A32"]
        },
        {
            id: 'maritza',
            name: "Maritza Yugchaoquendo",
            phone: "(203) 498-5699",
            email: "maritza.yugchaoquendo@assaabloy.com",
            regionDescription: "Pacific NW, Canada, International",
            keywords: ["WA", "WASHINGTON", "OR", "OREGON", "ID", "IDAHO", "AK", "ALASKA", "CANADA", "INTERNATIONAL", "INTL", "A44"]
        },
        {
            id: 'janelle',
            name: "Janelle Schmittberger",
            phone: "(203) 498-5693",
            email: "janelle.schmittberger@assaabloy.com",
            regionDescription: "Florida, Georgia, Arizona, California, Nevada",
            keywords: ["FL", "FLORIDA", "GA", "GEORGIA", "AZ", "ARIZONA", "CA", "CALIFORNIA", "NV", "NEVADA", "NM", "NEW MEXICO", "A15", "A37", "A38", "A39"]
        },
        {
            id: 'shirley',
            name: "Shirley Sotaski",
            phone: "(203) 498-5715",
            email: "shirley.sotaski@assaabloy.com",
            regionDescription: "Southwest, Gulf Central, Himmels",
            keywords: ["TX", "TEXAS", "OK", "OKLAHOMA", "AR", "ARKANSAS", "LA", "LOUISIANA", "MS", "MISSISSIPPI", "HIMMELS", "A27", "A28"]
        },
        {
            id: 'patricia',
            name: "Patricia Hansen",
            phone: "(203) 498-5596",
            email: "patricia.hansen@assaabloy.com",
            regionDescription: "Intermountain, Clark, Anixter, ADI, IDN, JLM",
            keywords: ["INTERMOUNTAIN", "CLARK", "ANIXTER", "ADI", "IDN", "JLM"]
        },
        {
            id: 'jennifer',
            name: "Jennifer Leslie",
            phone: "(203) 498-5698",
            email: "jennifer.leslie@assaabloy.com",
            regionDescription: "Akron, Banner, SELOCK, Norwood, Dugmore",
            keywords: ["AKRON", "BANNER", "SELOCK", "NORWOOD", "DUGMORE", "MIDWEST WHOLESALE"]
        }
    ], []);

    // Filter Logic: Matches Name OR Keywords
    const results = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase().trim();
        return csrData.filter(csr => 
            csr.name.toLowerCase().includes(lowerTerm) || 
            csr.keywords.some(k => k.toLowerCase().includes(lowerTerm))
        );
    }, [searchTerm, csrData]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="calculator-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px', height: 'auto', maxHeight: '85vh'}}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <MapPin className="modal-title-icon" />
                        Find Your CSR
                    </h2>
                    <button onClick={onClose} className="close-button"><X size={24}/></button>
                </div>
                
                <div className="modal-body">
                    <div className="input-group search-container">
                        <label className="input-label" htmlFor="csr-search">Search by State, Name, or Distributor</label>
                        <div className="search-input-wrapper">
                             <Search className="search-icon-absolute" size={20}/>
                             <input
                                id="csr-search"
                                type="text"
                                className="form-input with-icon"
                                placeholder="e.g. Georgia, Janelle, or CA..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="csr-results-list">
                        {searchTerm && results.length > 0 ? (
                            results.map(csr => (
                                <div key={csr.id} className="csr-result-card">
                                    <div className="csr-card-header">
                                        <div className="csr-avatar">
                                            <User size={24} color="#fff" />
                                        </div>
                                        <div>
                                            <h3 className="csr-name">{csr.name}</h3>
                                            <p className="csr-region-text">{csr.regionDescription}</p>
                                        </div>
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
                                <p>No direct match found.</p>
                                <p className="sub-text">Please contact Main Support:</p>
                                <a href="tel:800-727-5477" className="main-support-link">800-727-5477</a>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Info size={40} className="empty-icon"/>
                                <p>Enter a state name (e.g., "Texas"), a code (e.g., "TX"), or a CSR name to find your rep.</p>
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

  const products = [
    { id: 1, title: 'Templates Lookup Tool', description: "Streamlines your search for templates, making it easy to get exactly what you need.", url: 'https://sargent-templates.netlify.app/' },
    { id: 2, title: 'Parts Lookup Tool', description: "Effortlessly find the right parts with precise information, saving you time and hassle.", url: 'https://sargent-parts.netlify.app/' },
    { id: 3, title: 'Rod Length Calculator', description: "Precisely calculate Top Rod, Bottom Rod, and Rod Extension lengths for SVR and CVR exit devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { id: 9, title: 'Find Your CSR', description: "Locate your dedicated Customer Service Representative by state, region, or name.", onClick: () => setIsCsrSearchOpen(true) },
    { id: 4, title: 'Cylinders Tool', description: "Explains how door lock cylinders work and provides a visual breakdown of their individual components.", url: 'https://sargent-cylinders.netlify.app/' },
    { id: 6, title: 'Handing Tool', description: "Visually determine the correct left or right handing for door locks, ensuring a precise and proper installation.", url: 'https://sargenthanding.netlify.app/' },
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

      {/* Modals */}
      {isRodCalculatorOpen && <RodCalculator onClose={() => setIsRodCalculatorOpen(false)} />}
      {isCsrSearchOpen && <CsrSearchModal onClose={() => setIsCsrSearchOpen(false)} />}
    </div>
  );
};

export default App;