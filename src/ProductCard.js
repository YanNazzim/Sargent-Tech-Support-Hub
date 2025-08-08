import React from 'react';

// ProductCard now accepts a 'url' prop
function ProductCard({ image, title, description, url }) {
  return (
    // Wrap the entire card with a standard <a> tag
    <a href={url} target="_blank" rel="noopener noreferrer" className="product-card-link">
      <div className="product-card">
        <img src={image} alt={title} className="product-card-image" />
        <h3 className="product-card-title">{title}</h3>
        <p className="product-card-description">{description}</p>
      </div>
    </a>
  );
}

export default ProductCard;