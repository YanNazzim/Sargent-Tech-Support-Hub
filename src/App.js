import React, { useState } from 'react';
import './App.css';
import templates from './assets/templates.png';
import placeholder from './assets/placeholder.jpg';
import parts from './assets/parts.png';
import handing from './assets/handing.png';
import generalInfo from './assets/general_info.png';

// ProductCard component for the display
const ProductCard = ({ image, title, description, url }) => {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="product-card-link">
      <div className="product-card">
        <div className="product-card-inner">
          <img src={image} alt={title} className="product-card-image" />
          <h3 className="product-card-title">{title}</h3>
          <p className="product-card-description">{description}</p>
        </div>
      </div>
    </a>
  );
};

const App = () => {
  const products = [
    {
      id: 1,
      image: templates,
      title: 'Templates Lookup Tool',
      description: "Streamlines your search for templates, making it easy to get exactly what you need.",
      url: 'https://sargent-templates.netlify.app/'
    },
    {
      id: 2,
      image: parts,
      title: 'Parts Lookup Tool',
      description: "Effortlessly find the right parts with precise information, saving you time and hassle.",
      url: 'https://sargent-parts.netlify.app/'
    },
    {
      id: 3,
      image: templates,
      title: 'Cylinders Tool',
      description: "Explains how door lock cylinders work and provides a visual breakdown of their individual components.",
      url: 'https://sargent-cylinders.netlify.app/'
    },
    {
      id: 4,
      image: templates,
      title: 'Thick Door Tool',
      description: "Helps you select the correct part numbers for thick door applications, ensuring compatibility and fit.",
      url: 'https://sargent-thickdoor.netlify.app/'
    },
    {
      id: 5,
      image: handing,
      title: 'Handing Tool',
      description: "Visually determine the correct left or right handing for door locks, ensuring a precise and proper installation.",
      url: 'https://sargenthanding.netlify.app/'
    },
    {
      id: 6,
      image: generalInfo,
      title: 'General Product Information',
      description: "Your go-to resource for learning all about our product, its features, and benefits.",
      url: 'https://sargent-info.netlify.app/'
    },
  ];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleSliderChange = (e) => {
    const sliderValue = parseInt(e.target.value, 10);
    const newIndex = Math.round((sliderValue / 100) * (products.length - 1));
    setCurrentCardIndex(newIndex);
  };

  const handleNext = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % products.length);
  };

  const handlePrev = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
  };

  const currentProduct = products[currentCardIndex];

  return (
    <div className="App dark-mode">
      <header className="App-header">
        <a href='https://www.sargentlock.com/' target="_blank" rel="noopener noreferrer">
          <img src={placeholder} className="App-logo" alt="Sargent logo" />
        </a>
        <h1>Sargent Tech Support Hub</h1>
      </header>
      <div className="main-content-container">
        <div className="card-display-container">
          <button className="nav-arrow left-arrow" onClick={handlePrev}>&lt;</button>
          <ProductCard
            key={currentProduct.id}
            image={currentProduct.image}
            title={currentProduct.title}
            description={currentProduct.description}
            url={currentProduct.url}
          />
          <button className="nav-arrow right-arrow" onClick={handleNext}>&gt;</button>
        </div>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((currentCardIndex / (products.length - 1)) * 100)}
            onChange={handleSliderChange}
            className="card-slider"
          />
          <p className="slider-label">Product {currentCardIndex + 1} of {products.length}</p>
        </div>
      </div>
    </div>
  );
};

export default App;