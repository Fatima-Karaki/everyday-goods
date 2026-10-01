import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../format.js';
import OrderItems from '../components/OrderItems.jsx';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { logout } = useAuth();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setStatus('loading');

    api(`/orders/${encodeURIComponent(id)}`)
      .then((data) => {
        if (ignore) return;
        setOrder(data.order);
        setStatus('ready');
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) return logout();
        setError(err.message);
        setStatus(err.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (status === 'loading') {
    return <p className="status">Loading your order…</p>;
  }

  if (status === 'not-found') {
    return (
      <section className="empty-state">
        <h1>Order not found</h1>
        <p className="muted">We couldn't find this order in your account.</p>
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

  const placedAt = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const { shippingAddress } = order;

  return (
    <section className="confirmation">
      <div className="confirmation-header">
        <span className="confirmation-icon" aria-hidden="true">✓</span>
        <h1>Thank you, your order is confirmed</h1>
        <p className="muted">Placed on {placedAt}</p>
        <p>
          Order ID: <strong className="order-id">{order.id}</strong>
        </p>
      </div>

      <div className="panel">
        <h2>Items</h2>
        <OrderItems items={order.items} />
        <div className="summary-row summary-total">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        <h2>Shipping to</h2>
        <address className="shipping-address">
          {shippingAddress.fullName}
          <br />
          {shippingAddress.address}
          <br />
          {shippingAddress.city} {shippingAddress.postalCode}
          <br />
          {shippingAddress.country}
        </address>
      </div>

      <Link to="/" className="button">Continue shopping</Link>
    </section>
  );
}
