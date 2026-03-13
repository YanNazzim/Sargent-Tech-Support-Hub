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
  Scissors, RotateCcw, ExternalLink, Construction, Calculator
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

// --- MAIN APP COMPONENT ---
const App = () => {
  const [isRodCalculatorOpen, setIsRodCalculatorOpen] = useState(false);
  const [isCsrSearchOpen, setIsCsrSearchOpen] = useState(false);
  const [isHandingToolOpen, setIsHandingToolOpen] = useState(false);
  const [isRailCalculatorOpen, setIsRailCalculatorOpen] = useState(false);

  const calculators = [
    { id: 3, title: 'Rod Calculator', description: "Calculate Top Rod, Bottom Rod, and Extension lengths for SVR and CVR devices.", onClick: () => setIsRodCalculatorOpen(true) },
    { id: 5, title: 'Rail Calculator', description: "Determine uncut and cut rail lengths for 80 Series and PE80 Series Exit Devices.", onClick: () => setIsRailCalculatorOpen(true) },
  ];

  const externalTools = [
    { id: 1, title: 'Templates Lookup', description: "Search for templates for prep/installation.", url: 'https://sargent-templates.netlify.app/' },
    { id: 2, title: 'Parts Lookup', description: "Find parts with exploded views.", url: 'https://sargent-parts.netlify.app/' },
    { id: 4, title: 'Cylinders Tool', description: "Visual breakdown of cylinder components.", url: 'https://sargent-cylinders.netlify.app/' },
    { id: 7, title: 'General Info', description: "Learn about our product lines and features.", url: 'https://sargent-info.netlify.app/' },
    { id: 8, title: 'Product Quiz', description: "Test your Sargent Hardware knowledge.", url: 'https://sargent-quiz.netlify.app/' },
  ];

  const tools = [
    { id: 6, title: 'Handing Tool', description: "Visually determine the correct left or right handing for door locks and hardware.", onClick: () => setIsHandingToolOpen(true) },
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
            <div className="nav-status-tag">Last Updated 03-13-2026</div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="section-header">
            <div className="section-subtitle">Interactive Tools & Resources</div>
            <h1 className="section-title">Technical Support Gateway</h1>
        </div>
        
        {/* --- FIND YOUR CSR (Featured) --- */}
        <div className="featured-section">
          <div className="featured-card-border" onClick={() => setIsCsrSearchOpen(true)}>
            <div className="featured-card">
              <div className="featured-card-icon">
                <MapPin size={24} />
              </div>
              <div className="featured-card-content">
                <h3 className="featured-card-title">Find Your CSR</h3>
                <p className="featured-card-desc">Locate specific Customer Support Specialists for Sargent, Corbin Russwin, ACCENTRA, and Norton.</p>
              </div>
              <span className="featured-card-action">Search</span>
            </div>
          </div>
        </div>

        {/* --- CALCULATORS SECTION --- */}
        <div className="categorized-section">
          <div className="categorized-section-header">
            <Calculator size={18} className="categorized-section-icon" />
            <h2 className="categorized-section-title">Calculators</h2>
          </div>
          <div className="categorized-grid two-col">
            {calculators.map((calc) => {
              const Icon = calc.id === 3 ? Ruler : Scissors;
              return (
                <div key={calc.id} onClick={calc.onClick} className="categorized-card">
                  <div className="categorized-card-icon">
                    <Icon size={20} />
                  </div>
                  <div className="categorized-card-content">
                    <h3 className="categorized-card-title">{calc.title}</h3>
                    <p className="categorized-card-desc">{calc.description}</p>
                  </div>
                  <span className="categorized-card-action">Open</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- EXTERNAL TOOLS SECTION --- */}
        <div className="categorized-section">
          <div className="categorized-section-header">
            <ExternalLink size={18} className="categorized-section-icon" />
            <h2 className="categorized-section-title">External Tools</h2>
          </div>
          <div className="categorized-grid three-col">
            {externalTools.map((tool) => {
              const Icon = productIcons[tool.id] || Settings;
              return (
                <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="categorized-card">
                  <div className="categorized-card-icon">
                    <Icon size={20} />
                  </div>
                  <div className="categorized-card-content">
                    <h3 className="categorized-card-title">{tool.title}</h3>
                    <p className="categorized-card-desc">{tool.description}</p>
                  </div>
                  <ExternalLink size={16} className="categorized-card-external" />
                </a>
              );
            })}
          </div>
        </div>

        {/* --- INTERACTIVE TOOLS SECTION --- */}
        <div className="categorized-section">
          <div className="categorized-section-header">
            <Wrench size={18} className="categorized-section-icon" />
            <h2 className="categorized-section-title">Interactive Tools</h2>
          </div>
          <div className="categorized-grid two-col">
            {tools.map((tool) => {
              const Icon = productIcons[tool.id] || Settings;
              return (
                <div key={tool.id} onClick={tool.onClick} className="categorized-card">
                  <div className="categorized-card-icon">
                    <Icon size={20} />
                  </div>
                  <div className="categorized-card-content">
                    <h3 className="categorized-card-title">{tool.title}</h3>
                    <p className="categorized-card-desc">{tool.description}</p>
                  </div>
                  <span className="categorized-card-action">Open</span>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="app-footer">
          <p className="footer-copyright">&copy; 2026 Sargent Manufacturing. All Rights Reserved.</p>
          <p className="footer-credit">Designed, developed &amp; maintained by Yan Gonzalez</p>
        </footer>
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