import { Link } from 'react-router';
import { formatPrice } from '../format.js';

export default function ProductCard({ product }) {
  const soldOut = product.stock === 0;

  let stockText = 'In stock';
  if (soldOut) stockText = 'Out of stock';
  else if (product.stock <= 5) stockText = `Only ${product.stock} left`;

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} loading="lazy" />
        {soldOut && <span className="badge">Out of stock</span>}
      </div>
      <div className="product-card-body">
        <h2 className="product-card-title">{product.name}</h2>
        <p className="price">{formatPrice(product.price)}</p>
        {product.variants.length > 1 && (
          <ul className="variant-chips">
            {product.variants.map((variant) => (
              <li key={variant.id} className={variant.stock === 0 ? 'unavailable' : undefined}>
                {variant.label}
                {variant.stock === 0 && <span className="visually-hidden"> (out of stock)</span>}
              </li>
            ))}
          </ul>
        )}
        <p className={soldOut ? 'stock stock-out' : 'stock'}>{stockText}</p>
        <span className="product-card-link">View details</span>
      </div>
    </Link>
  );
}
