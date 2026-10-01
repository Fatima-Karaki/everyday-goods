import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../format.js';
import QuantityInput from '../components/QuantityInput.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    setMessage(null);

    api(`/products/${encodeURIComponent(id)}`)
      .then((data) => {
        if (ignore) return;
        const firstAvailable = data.product.variants.find((v) => v.stock > 0) ?? data.product.variants[0];
        setProduct(data.product);
        setVariantId(firstAvailable?.id ?? null);
        setQuantity(1);
        setStatus('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setStatus(err.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setInWishlist(false);
      return;
    }
    api('/wishlist')
      .then((data) => setInWishlist(data.items.some((p) => p.id === id)))
      .catch(() => {});
  }, [user, id]);

  if (status === 'loading') {
    return <p className="status">Loading product…</p>;
  }

  if (status === 'not-found') {
    return (
      <section className="empty-state">
        <h1>Product not found</h1>
        <p className="muted">This product doesn't exist or is no longer available.</p>
        <Link to="/" className="button">Back to products</Link>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section>
        <div className="alert alert-error" role="alert">{error}</div>
        <Link to="/">← Back to products</Link>
      </section>
    );
  }

  const variant = product.variants.find((v) => v.id === variantId);
  const hasOptions = product.variants.length > 1;
  const available = variant?.stock ?? 0;
  const soldOut = available === 0;

  function selectVariant(nextId) {
    setVariantId(nextId);
    setQuantity(1);
    setMessage(null);
  }

  function redirectToLogin() {
    navigate('/login', { state: { from: location } });
  }

  async function handleActionError(err) {
    if (err.status === 401) {
      await logout();
      redirectToLogin();
      return;
    }
    setMessage({ type: 'error', text: err.message });
  }

  async function handleAddToCart() {
    if (!user) return redirectToLogin();

    setBusy(true);
    setMessage(null);
    try {
      await api('/cart/items', {
        method: 'POST',
        body: { productId: product.id, variantId: variant.id, quantity },
      });
      const label = hasOptions ? ` (${variant.label})` : '';
      setMessage({ type: 'success', text: `Added ${quantity} × ${product.name}${label} to your cart.` });
    } catch (err) {
      await handleActionError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddToWishlist() {
    if (!user) return redirectToLogin();

    setBusy(true);
    setMessage(null);
    try {
      await api('/wishlist', { method: 'POST', body: { productId: product.id } });
      setInWishlist(true);
    } catch (err) {
      await handleActionError(err);
    } finally {
      setBusy(false);
    }
  }

  let stockText = `${available} in stock`;
  if (soldOut) stockText = hasOptions ? 'This option is out of stock' : 'Out of stock';
  else if (available <= 5) stockText = `Only ${available} left`;

  return (
    <section>
      <Link to="/" className="back-link">← Back to products</Link>

      <div className="product-detail">
        <div className="product-image">
          <img src={product.image} alt={product.name} />
          {product.stock === 0 && <span className="badge">Out of stock</span>}
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="price price-large">{formatPrice(product.price)}</p>
          <p>{product.description}</p>

          {hasOptions && (
            <fieldset className="variant-picker">
              <legend>Choose an option</legend>
              <div className="variant-options">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={v.id === variantId ? 'variant-option selected' : 'variant-option'}
                    aria-pressed={v.id === variantId}
                    disabled={v.stock === 0}
                    onClick={() => selectVariant(v.id)}
                  >
                    {v.label}
                    {v.stock === 0 && <span className="visually-hidden"> (out of stock)</span>}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <p className={soldOut ? 'stock stock-out' : 'stock'}>{stockText}</p>

          {!soldOut && (
            <div className="field">
              <span className="field-label">Quantity</span>
              <QuantityInput value={quantity} max={available} onChange={setQuantity} disabled={busy} />
            </div>
          )}

          <div className="product-actions">
            <button type="button" className="button" onClick={handleAddToCart} disabled={busy || soldOut || authLoading}>
              {soldOut ? 'Out of stock' : 'Add to cart'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleAddToWishlist}
              disabled={busy || inWishlist || authLoading}
            >
              {inWishlist ? '♥ In your wishlist' : '♡ Add to wishlist'}
            </button>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`} role="status">
              {message.text}
              {message.type === 'success' && <> <Link to="/cart">View cart</Link></>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
