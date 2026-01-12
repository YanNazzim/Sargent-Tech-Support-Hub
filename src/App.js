import React, { useState } from 'react';
import './App.css'; // Global dark theme styles
import placeholder from './assets/placeholder.jpg';
import RodCalculator from './RodCalculator';

// Icons
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
  8: Info, 
};

// ProductCard Component
const ProductCard = ({ title, description, url, onClick, id }) => {
  const Icon = productIcons[id] || Settings; 

  const CardContent = (
    <div className="product-card">
      {/* Icon Area (Left) */}
      <div className="card-icon-container">
        <Icon className="card-icon" aria-hidden="true" />
      </div>

      {/* Content Area (Center) */}
      <div className="card-text-content">
          <h3 className="card-title">{title}</h3>
          <p className="card-description">{description}</p>
      </div>
      
      {/* Action Button (Right) */}
      <div className="card-button-container">
        <span className="card-button">
          {url ? 'Launch Tool' : 'Open Tool'}
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
            if (e.key === 'Enter' || e.key === ' ') onClick();
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
  // State for Calculator Modal
  const [isRodCalculatorOpen, setIsRodCalculatorOpen] = useState(false);

  const products = [
    { id: 1, title: 'Templates Lookup Tool', description: "Streamlines your search for templates, making it easy to get exactly what you need.", url: 'https://sargent-templates.netlify.app/' },
    { id: 2, title: 'Parts Lookup Tool', description: "Effortlessly find the right parts with precise information, saving you time and hassle.", url: 'https://sargent-parts.netlify.app/' },
    { id: 3, title: 'Rod Length Calculator', description: "Precisely calculate Top Rod, Bottom Rod, and Rod Extension lengths for SVR and CVR exit devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { id: 4, title: 'Cylinders Tool', description: "Explains how door lock cylinders work and provides a visual breakdown of their individual components.", url: 'https://sargent-cylinders.netlify.app/' },
    { id: 6, title: 'Handing Tool', description: "Visually determine the correct left or right handing for door locks, ensuring a precise and proper installation.", url: 'https://sargenthanding.netlify.app/' },
    { id: 7, title: 'General Product Information', description: "Your go-to resource for learning all about our product, its features, and benefits.", url: 'https://sargent-info.netlify.app/' },
    { id: 8, title: 'Sargent Product Quiz', description: "Test your knowledge of Sargent Hardware and products with this interactive quiz.", url: 'https://sargent-quiz.netlify.app/' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="max-w-7xl header-content">
            {/* Logo */}
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
              title={product.title}
              description={product.description}
              url={product.url}
              onClick={product.onClick}
            />
          ))}
        </div>
      </div>

      {/* Rod Calculator Modal */}
      {isRodCalculatorOpen && (
        <RodCalculator onClose={() => setIsRodCalculatorOpen(false)} />
      )}
    </div>
  );
};

export default App;