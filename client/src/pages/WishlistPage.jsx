import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../format.js';

export default function WishlistPage() {
  const { logout } = useAuth();
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState({});
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api('/wishlist')
      .then((data) => setItems(data.items))
      .catch((err) => (err.status === 401 ? logout() : setLoadError(err.message)));
  }, []);

  async function runAction(product, action) {
    setPending(product.id);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      if (err.status === 401) return logout();
      setNotice({ productId: product.id, type: 'error', text: err.message });
    } finally {
      setPending(null);
    }
  }

  function removeItem(product) {
    runAction(product, async () => {
      const data = await api(`/wishlist/${product.id}`, { method: 'DELETE' });
      setItems(data.items);
    });
  }

  function addToCart(product, variant) {
    runAction(product, async () => {
      await api('/cart/items', {
        method: 'POST',
        body: { productId: product.id, variantId: variant.id, quantity: 1 },
      });
      setNotice({ productId: product.id, type: 'success', text: 'Added to your cart.' });
    });
  }

  if (loadError) {
    return <div className="alert alert-error" role="alert">{loadError}</div>;
  }
  if (!items) {
    return <p className="status">Loading your wishlist…</p>;
  }

  if (!items.length) {
    return (
      <section className="empty-state">
        <h1>Your wishlist is empty</h1>
        <p className="muted">Tap “Add to wishlist” on any product to save it here for later.</p>
        <Link to="/" className="button">Browse products</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Your wishlist</h1>

      <ul className="product-grid wishlist">
        {items.map((product) => {
          const variant =
            product.variants.find((v) => v.id === selected[product.id]) ??
            product.variants.find((v) => v.stock > 0) ??
            product.variants[0];
          const busy = pending === product.id;
          const soldOut = !variant || variant.stock === 0;

          let stockText = 'In stock';
          if (soldOut) stockText = 'Out of stock';
          else if (variant.stock <= 5) stockText = `Only ${variant.stock} left`;

          return (
            <li key={product.id} className="wishlist-item">
              <Link to={`/products/${product.id}`} className="product-image">
                <img src={product.image} alt={product.name} loading="lazy" />
                {product.stock === 0 && <span className="badge">Out of stock</span>}
              </Link>

              <div className="product-card-body">
                <Link to={`/products/${product.id}`} className="product-card-title">{product.name}</Link>
                <p className="price">{formatPrice(product.price)}</p>

                {product.variants.length > 1 && (
                  <select
                    className="select"
                    aria-label={`Option for ${product.name}`}
                    value={variant.id}
                    onChange={(e) => setSelected({ ...selected, [product.id]: e.target.value })}
                  >
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.stock === 0}>
                        {v.label}{v.stock === 0 ? ' (out of stock)' : ''}
                      </option>
                    ))}
                  </select>
                )}

                <p className={soldOut ? 'stock stock-out' : 'stock'}>{stockText}</p>

                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="button button-small"
                    onClick={() => addToCart(product, variant)}
                    disabled={busy || soldOut}
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={() => removeItem(product)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </div>

                {notice?.productId === product.id && (
                  <div className={`alert alert-${notice.type} alert-small`} role="alert">
                    {notice.text}
                    {notice.type === 'success' && <> <Link to="/cart">View cart</Link></>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
