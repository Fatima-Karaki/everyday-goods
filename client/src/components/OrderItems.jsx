import { formatPrice } from '../format.js';

export default function OrderItems({ items }) {
  return (
    <ul className="order-items">
      {items.map((item) => (
        <li key={item.variantId} className="order-item">
          <img src={item.image} alt="" className="order-item-image" />
          <div className="order-item-info">
            <p className="order-item-name">{item.name}</p>
            <p className="muted">{item.variantLabel}</p>
            <div className="order-item-price">
              <span className="muted">{item.quantity} × {formatPrice(item.unitPrice)}</span>
              <strong>{formatPrice(item.subtotal)}</strong>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
