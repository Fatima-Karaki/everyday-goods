import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../format.js';
import OrderItems from '../components/OrderItems.jsx';

const addressFields = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'address', label: 'Street address', autoComplete: 'street-address' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
];

export default function CheckoutPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [address, setAddress] = useState({
    fullName: user.name,
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  function loadCart() {
    return api('/cart').then(setCart);
  }

  useEffect(() => {
    loadCart().catch((err) => (err.status === 401 ? logout() : setLoadError(err.message)));
  }, []);

  function handleChange(e) {
    setAddress({ ...address, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = {};
    for (const field of addressFields) {
      if (!address[field.name].trim()) nextErrors[field.name] = `${field.label} is required`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const { order } = await api('/orders', { method: 'POST', body: { shippingAddress: address } });
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      submittingRef.current = false;
      setSubmitting(false);
      if (err.status === 401) return logout();

      if (err.data?.fields) {
        setErrors(Object.fromEntries(err.data.fields.map((f) => [f, 'This field is required'])));
      }
      setSubmitError(err.message);
      loadCart().catch(() => {});
    }
  }

  if (loadError) {
    return (
      <section>
        <div className="alert alert-error" role="alert">{loadError}</div>
        <Link to="/cart">← Back to cart</Link>
      </section>
    );
  }
  if (!cart) {
    return <p className="status">Loading checkout…</p>;
  }

  if (!cart.items.length) {
    return (
      <section className="empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Add some products to your cart before checking out.</p>
        <Link to="/" className="button">Browse products</Link>
      </section>
    );
  }

  const unavailable = cart.items.filter((item) => item.quantity > item.stock);

  return (
    <section>
      <Link to="/cart" className="back-link">← Back to cart</Link>
      <h1>Checkout</h1>

      <form className="cart-layout" onSubmit={handleSubmit} noValidate>
        <div className="panel">
          <h2>Shipping address</h2>
          {addressFields.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                autoComplete={field.autoComplete}
                value={address[field.name]}
                onChange={handleChange}
                disabled={submitting}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              />
              {errors[field.name] && (
                <p id={`${field.name}-error`} className="field-error">{errors[field.name]}</p>
              )}
            </div>
          ))}
          <p className="muted checkout-note">No payment is taken. Your order is confirmed as soon as you place it.</p>
        </div>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <OrderItems items={cart.items} />
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>

          {unavailable.length > 0 && (
            <div className="alert alert-error">
              <p>Some items don't have enough stock:</p>
              <ul className="stock-issues">
                {unavailable.map((item) => (
                  <li key={item.variantId}>
                    {item.name} ({item.variantLabel}): {item.stock === 0 ? 'out of stock' : `only ${item.stock} left`}
                  </li>
                ))}
              </ul>
              <Link to="/cart">Update your cart</Link>
            </div>
          )}

          {submitError && unavailable.length === 0 && (
            <div className="alert alert-error" role="alert">{submitError}</div>
          )}

          <button type="submit" className="button button-block" disabled={submitting || unavailable.length > 0}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </form>
    </section>
  );
}
