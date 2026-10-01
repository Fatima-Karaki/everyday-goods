import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../format.js';
import QuantityInput from '../components/QuantityInput.jsx';

export default function CartPage() {
  const { logout } = useAuth();
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState({});
  const [loadError, setLoadError] = useState('');
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState(null);
  const latestRequest = useRef(0);

  useEffect(() => {
    Promise.all([api('/cart'), api('/products')])
      .then(([cartData, productData]) => {
        setCart(cartData);
        setProducts(Object.fromEntries(productData.products.map((p) => [p.id, p])));
      })
      .catch((err) => (err.status === 401 ? logout() : setLoadError(err.message)));
  }, []);

  async function runAction(item, action) {
    const requestId = ++latestRequest.current;
    setNotice(null);
    try {
      const data = await action();
      if (requestId === latestRequest.current) setCart(data);
      return true;
    } catch (err) {
      if (err.status === 401) {
        logout();
        return false;
      }
      setNotice({ variantId: item.variantId, type: 'error', text: err.message });
      const data = await api('/cart').catch(() => null);
      if (data && requestId === latestRequest.current) setCart(data);
      return false;
    }
  }

  function updateQuantity(item, quantity) {
    if (quantity === item.quantity) return;
    setCart((current) => ({
      ...current,
      items: current.items.map((i) =>
        i.variantId === item.variantId ? { ...i, quantity, subtotal: i.unitPrice * quantity } : i
      ),
    }));
    runAction(item, () => api(`/cart/items/${item.variantId}`, { method: 'PATCH', body: { quantity } }));
  }

  async function removeItem(item) {
    setPending(item.variantId);
    await runAction(item, () => api(`/cart/items/${item.variantId}`, { method: 'DELETE' }));
    setPending(null);
  }

  async function changeVariant(item, variantId) {
    const variant = products[item.productId].variants.find((v) => v.id === variantId);
    const quantity = Math.min(item.quantity, variant.stock);

    setPending(item.variantId);
    const changed = await runAction(item, async () => {
      await api('/cart/items', {
        method: 'POST',
        body: { productId: item.productId, variantId, quantity },
      });
      return api(`/cart/items/${item.variantId}`, { method: 'DELETE' });
    });
    setPending(null);

    if (changed && quantity < item.quantity) {
      setNotice({
        variantId,
        type: 'info',
        text: `Only ${variant.stock} available in ${variant.label}, so the quantity was updated.`,
      });
    }
  }

  if (loadError) {
    return <div className="alert alert-error" role="alert">{loadError}</div>;
  }
  if (!cart) {
    return <p className="status">Loading your cart…</p>;
  }

  if (!cart.items.length) {
    return (
      <section className="empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Browse the shop and add something you like.</p>
        <Link to="/" className="button">Continue shopping</Link>
      </section>
    );
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  const hasUnavailable = cart.items.some((item) => item.quantity > item.stock);

  return (
    <section>
      <h1>Your cart</h1>

      <div className="cart-layout">
        <ul className="cart-items">
          {cart.items.map((item) => {
            const variants = products[item.productId]?.variants ?? [];
            const busy = pending === item.variantId;

            return (
              <li key={item.variantId} className="cart-item">
                <Link to={`/products/${item.productId}`} className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </Link>

                <div className="cart-item-info">
                  <Link to={`/products/${item.productId}`} className="cart-item-name">{item.name}</Link>
                  <p className="muted">{formatPrice(item.unitPrice)} each</p>
                  {variants.length > 1 && (
                    <select
                      className="select"
                      aria-label={`Option for ${item.name}`}
                      value={item.variantId}
                      disabled={busy}
                      onChange={(e) => changeVariant(item, e.target.value)}
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.stock === 0 && v.id !== item.variantId}>
                          {v.label}{v.stock === 0 ? ' (out of stock)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="cart-item-qty">
                  {item.stock === 0 ? (
                    <p className="stock stock-out">Out of stock</p>
                  ) : (
                    <QuantityInput
                      value={item.quantity}
                      max={item.stock}
                      disabled={busy}
                      onChange={(quantity) => updateQuantity(item, quantity)}
                    />
                  )}
                  {item.stock > 0 && item.quantity > item.stock && (
                    <p className="field-error">Only {item.stock} left</p>
                  )}
                </div>

                <p className="cart-item-subtotal">{formatPrice(item.subtotal)}</p>

                <button
                  type="button"
                  className="link-button cart-item-remove"
                  onClick={() => removeItem(item)}
                  disabled={busy}
                >
                  Remove
                </button>

                {notice?.variantId === item.variantId && (
                  <div className={`alert alert-${notice.type} cart-item-notice`} role="alert">
                    {notice.text}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Items ({itemCount})</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {hasUnavailable && (
            <p className="field-error">
              Some items are no longer available in the selected quantity. Update your cart to continue.
            </p>
          )}
          {hasUnavailable ? (
            <button type="button" className="button button-block" disabled>Proceed to checkout</button>
          ) : (
            <Link to="/checkout" className="button button-block">Proceed to checkout</Link>
          )}
          <Link to="/" className="button button-secondary button-block">Continue shopping</Link>
        </aside>
      </div>
    </section>
  );
}
