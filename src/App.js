import React, { useState } from 'react';
import './App.css'; // Global dark theme styles
import placeholder from './assets/placeholder.jpg';
import RodCalculator from './RodCalculator';
import HandingTool from './HandingTool';
import RailCalculator from './RailCalculator';
import CsrSearchModal from './CsrSearchModal'; // Import new modal

// Icons for Product Cards
import { Settings, Wrench, Lock, Ruler, Info, MapPin, Scissors, RotateCcw } from 'lucide-react'; 

// Map product ID to Lucide icon
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
};

// --- COMPONENT: PRODUCT CARD ---
const ProductCard = ({ title, description, url, onClick, id, isNew }) => {
  const Icon = productIcons[id] || Settings; 
  const cardClassName = isNew ? "product-card-div new-feature-glow" : "product-card-div";
  const linkClassName = isNew ? "product-card-link new-feature-glow" : "product-card-link";

  const CardContent = (
    <div className="product-card">
      {isNew && <span className="new-badge">NEW!</span>}
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
    return <a href={url} target="_blank" rel="noopener noreferrer" className={linkClassName}>{CardContent}</a>;
  } else if (onClick) {
    return <div onClick={onClick} className={cardClassName}>{CardContent}</div>;
  }
  return <div className={cardClassName}>{CardContent}</div>;
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
    { 
        id: 9, 
        title: 'Find Your CSR', 
        description: "Locate Customer Support Specialists for Sargent, Corbin Russwin, ACCENTRA, and Norton Rixson.", 
        onClick: () => setIsCsrSearchOpen(true),
        isNew: true 
    },
    { id: 3, title: 'Rod Length Calculator', description: "Precisely calculate Top Rod, Bottom Rod, and Rod Extension lengths for SVR and CVR exit devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { 
        id: 5, 
        title: 'Rail Length Calculator', 
        description: "Determine uncut and cut rail lengths for 80 Series and PE80 Series Exit Devices based on door width.", 
        onClick: () => setIsRailCalculatorOpen(true),
        isNew: true 
    },
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
              isNew={product.isNew}
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