import React, { useState } from 'react';
import './App.css';
import templates from './assets/templates.png';
import placeholder from './assets/placeholder.jpg';
import parts from './assets/parts.png';
import handing from './assets/handing.png';
import generalInfo from './assets/general_info.png';
import RodCalculator from './RodCalculator';
import { Settings, Wrench, Lock, DoorOpen, Ruler, Info } from 'lucide-react'; 

// Map product ID to Lucide icon for a richer visual
const productIcons = {
  1: Settings, 
  2: Wrench, 
  3: Ruler, 
  4: Lock, 
  5: DoorOpen, 
  6: DoorOpen, 
  7: Info, 
  8: Info, // New entry for the Quiz
};

// ProductCard component: Rewritten with pure CSS classes
const ProductCard = ({ image, title, description, url, onClick, id }) => {
  const Icon = productIcons[id] || Settings; 

  const CardContent = (
    <div className="product-card">
      {/* Icon Area */}
      <div className="card-icon-container">
        <Icon className="card-icon" aria-hidden="true" />
      </div>

      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
      
      {/* Action Button/Link at the bottom */}
      <div className="card-button-container">
        <span className="card-button">
          {url ? 'Launch Tool' : 'Open Calculator'}
        </span>
      </div>
    </div>
  );

  if (url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="product-card-link"
      >
        {CardContent}
      </a>
    );
  } else if (onClick) {
    return (
      <div 
        onClick={onClick} 
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                onClick();
            }
        }}
        role="button"
        tabIndex="0"
        aria-label={`Open ${title}`}
        className="product-card-div"
      >
        {CardContent}
      </div>
    );
  }

  return <div className="product-card-div">{CardContent}</div>;
};

const App = () => {
  const [isRodCalculatorOpen, setIsRodCalculatorOpen] = useState(false);

  const products = [
    { id: 1, image: templates, title: 'Templates Lookup Tool', description: "Streamlines your search for templates, making it easy to get exactly what you need.", url: 'https://sargent-templates.netlify.app/' },
    { id: 2, image: parts, title: 'Parts Lookup Tool', description: "Effortlessly find the right parts with precise information, saving you time and hassle.", url: 'https://sargent-parts.netlify.app/' },
    { id: 3, image: templates, title: 'Rod Length Calculator', description: "Precisely calculate Top Rod, Bottom Rod, and Rod Extension lengths for SVR and CVR exit devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { id: 4, image: templates, title: 'Cylinders Tool', description: "Explains how door lock cylinders work and provides a visual breakdown of their individual components.", url: 'https://sargent-cylinders.netlify.app/' },
    { id: 5, image: templates, title: 'Thick Door Tool', description: "Helps you select the correct part numbers for thick door applications, ensuring compatibility and fit.", url: 'https://sargent-thickdoor.netlify.app/' },
    { id: 6, image: handing, title: 'Handing Tool', description: "Visually determine the correct left or right handing for door locks, ensuring a precise and proper installation.", url: 'https://sargenthanding.netlify.app/' },
    { id: 7, image: generalInfo, title: 'General Product Information', description: "Your go-to resource for learning all about our product, its features, and benefits.", url: 'https://sargent-info.netlify.app/' },
    // NEW: Sargent Product Quiz
    { id: 8, image: generalInfo, title: 'Sargent Product Quiz', description: "Test your knowledge of Sargent Hardware and products with this interactive quiz.", url: 'https://sargent-quiz.netlify.app/' },
  ];

  if (isRodCalculatorOpen) {
    return <RodCalculator onClose={() => setIsRodCalculatorOpen(false)} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="max-w-7xl header-content">
          {/* LOGO LINK - Simplified and centered via CSS */}
          <a href='https://www.sargentlock.com/' target="_blank" rel="noopener noreferrer" aria-label="Go to Sargent website">
            <img src={placeholder} className="header-logo" alt="Sargent logo" />
          </a>
        </div>
      </header>

      <div className="max-w-7xl" style={{ paddingBottom: '3rem', paddingTop: '3rem' }}>
        <div className="section-title-container">
            <p className="section-tag">
                Interactive Tools & Resources
            </p>
            <h2 className="section-title">
                Technical Support Gateway
            </h2>
        </div>
        
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id} 
              image={product.image}
              title={product.title}
              description={product.description}
              url={product.url}
              onClick={product.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;