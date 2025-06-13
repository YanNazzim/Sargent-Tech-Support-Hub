import React from 'react';
import ProductCard from './ProductCard';
import './App.css';

// You'll replace these with actual paths to your product images
import templates from './assets/templates.png'; // Assuming you have placeholder.jpg in src/assets
import placeholder from './assets/placeholder.jpg'; // Placeholder image for other products
import parts from './assets/parts.png'; // Assuming you have parts.png in src/assets
import handing from './assets/handing.png'; // Assuming you have handing.png in src/assets
import generalInfo from './assets/general_info.png'; // Assuming you have general-info.png in src/assets

function App() {
  const products = [
    {
      id: 1,
      image: templates,
      title: 'Templates Lookup Tool',
      description: "Streamlines your search for templates, making it easy to get exactly what you need.",
      url: 'https://sargent-templates.netlify.app/' // Replace with your actual templates link
    },
    {
      id: 2,
      image: parts,
      title: 'Parts Lookup Tool',
      description: "Effortlessly find the right parts with precise information, saving you time and hassle.",
      url: 'https://sargent-parts.netlify.app/' // Replace with your actual parts link
    },
    {
      id: 3,
      image: handing,
      title: 'Handing Tool',
      description: "Visually determine the correct left or right handing for door locks, ensuring a precise and proper installation.",
      url: 'https://sargenthanding.netlify.app/' // Replace with your actual handing tool link
    },
    {
      id: 4,
      image: generalInfo,
      title: 'General Product Information',
      description: "Your go-to resource for learning all about our product, its features, and benefits.",
      url: 'https://sargent-info.netlify.app/' // Replace with your actual info link
    },
  ];

  return (
    <div className="App">
      <header className="App-header">
        <a href='https://www.sargentlock.com/' target="_blank" rel="noopener noreferrer">
        <img src={placeholder} className="App-logo" alt="logo" />
        </a>
        <h1>Sargent Tech Support Hub</h1>
      </header>
      <div className="product-cards-container">
        {products.map(product => (
          <ProductCard
            key={product.id}
            image={product.image}
            title={product.title}
            description={product.description}
            url={product.url}
          />
        ))}
      </div>
    </div>
  );
}

export default App;