/* src/App.js */
import React, { useState } from 'react';
import './App.css'; 
import sargentLogo from './assets/placeholder.jpg'; 
import RodCalculator from './RodCalculator';
import HandingTool from './HandingTool';
import RailCalculator from './RailCalculator';
import CsrSearchModal from './CsrSearchModal'; 

// Icons
import { 
  Settings, Wrench, Lock, Ruler, Info, MapPin, 
  Scissors, RotateCcw, ExternalLink, Construction 
} from 'lucide-react'; 

const productIcons = {
  1: Settings, 
  2: Wrench, 
  3: Ruler, 
  4: Lock, 
  5: Scissors, 
  6: RotateCcw, 
  7: Info, 
  8: Info, 
  9: MapPin, 
  10: Construction, // Icon for the Configurator tool
};

// --- COMPONENT: PRODUCT CARD ---
const ProductCard = ({ title, description, url, onClick, id, isNew, isBeta }) => {
  const Icon = productIcons[id] || Settings; 
  
  // Determine wrapper class based on status
  let wrapperClass = "product-card-wrapper";
  if (isNew) wrapperClass += " new-feature-glow";
  if (isBeta) wrapperClass += " beta-feature-glow"; // New class for yellow glow
  
  const CardContent = (
    <div className="product-card">
      {isNew && <span className="new-badge">NEW</span>}
      {isBeta && <span className="beta-badge">BETA - WORK IN PROGRESS</span>}
      
      <div className="card-header-row">
        <div className="card-icon-container">
            <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className="card-title">{title}</h3>
      </div>

      <p className="card-description">{description}</p>
      
      <div className="card-footer">
        <span className="card-button">
          {url ? (
            <>Launch Tool <ExternalLink size={16} style={{marginLeft: '8px'}} /></>
          ) : 'Open Tool'}
        </span>
      </div>
    </div>
  );

  if (url) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className={wrapperClass}>{CardContent}</a>;
  } else if (onClick) {
    return <div onClick={onClick} className={wrapperClass} style={{cursor: 'pointer'}}>{CardContent}</div>;
  }
  return <div className={wrapperClass}>{CardContent}</div>;
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [isRodCalculatorOpen, setIsRodCalculatorOpen] = useState(false);
  const [isCsrSearchOpen, setIsCsrSearchOpen] = useState(false);
  const [isHandingToolOpen, setIsHandingToolOpen] = useState(false);
  const [isRailCalculatorOpen, setIsRailCalculatorOpen] = useState(false);

  const products = [
    { id: 1, title: 'Templates Lookup', description: "Streamlines your search for templates, making it easy to get exactly what you need for prep/installation.", url: 'https://sargent-templates.netlify.app/' },
    { id: 2, title: 'Parts Lookup', description: "Effortlessly find the right parts with precise information and exploded views.", url: 'https://sargent-parts.netlify.app/' },
    { id: 9, title: 'Find Your CSR', description: "Locate specific Customer Support Specialists for Sargent, Corbin Russwin, ACCENTRA, and Norton.", onClick: () => setIsCsrSearchOpen(true), isNew: true },
    { id: 3, title: 'Rod Calculator', description: "Precisely calculate Top Rod, Bottom Rod, and Extension lengths for SVR and CVR devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { id: 5, title: 'Rail Calculator', description: "Determine uncut and cut rail lengths for 80 Series and PE80 Series Exit Devices.", onClick: () => setIsRailCalculatorOpen(true), isNew: true },
    { id: 6, title: 'Handing Tool', description: "Visually determine the correct left or right handing for door locks and hardware.", onClick: () => setIsHandingToolOpen(true) },
    { id: 4, title: 'Cylinders Tool', description: "Explains how door lock cylinders work and provides a visual breakdown of components.", url: 'https://sargent-cylinders.netlify.app/' },
    { id: 7, title: 'General Info', description: "Your go-to resource for learning all about our product lines and features.", url: 'https://sargent-info.netlify.app/' },
    { id: 8, title: 'Product Quiz', description: "Test your technical knowledge of Sargent Hardware products with this interactive assessment.", url: 'https://sargent-quiz.netlify.app/' },
  ];

  return (
    <div className="app-container">
      {/* GLASS NAVBAR */}
      <nav className="app-nav">
        <div className="nav-container">
          <div className="nav-left">
            <img src={sargentLogo} className="nav-logo" alt="Sargent Logo" />
            <div className="nav-divider"></div>
            <span className="nav-brand-text">Sargent</span>
          </div>
          <div className="nav-right">
            <div className="nav-status-tag">Last Updated 02-06-2026</div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="section-header">
            <div className="section-subtitle">Interactive Tools & Resources</div>
            <h1 className="section-title">Technical Support Gateway</h1>
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
              isNew={product.isNew}
              isBeta={product.isBeta}
            />
          ))}
        </div>
      </main>

      {/* MODALS */}
      {isRodCalculatorOpen && <RodCalculator onClose={() => setIsRodCalculatorOpen(false)} />}
      {isCsrSearchOpen && <CsrSearchModal onClose={() => setIsCsrSearchOpen(false)} />}
      {isHandingToolOpen && <HandingTool onClose={() => setIsHandingToolOpen(false)} />}
      {isRailCalculatorOpen && <RailCalculator onClose={() => setIsRailCalculatorOpen(false)} />}
    </div>
  );
};

export default App;