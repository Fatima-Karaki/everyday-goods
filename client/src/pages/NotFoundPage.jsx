import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="empty-state">
      <h1>Page not found</h1>
      <p className="muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="button">Back to products</Link>
    </section>
  );
}
