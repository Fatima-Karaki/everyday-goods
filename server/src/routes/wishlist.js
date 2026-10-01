import express from 'express';
import { db, save } from '../db.js';
import { withStock } from './products.js';

const router = express.Router();

function wishlistResponse(userId) {
  const ids = db.wishlists[userId] ?? [];
  const items = ids
    .map((id) => db.products.find((p) => p.id === id))
    .filter(Boolean)
    .map(withStock);
  return { items };
}

router.get('/', (req, res) => {
  res.json(wishlistResponse(req.user.id));
});

router.post('/', (req, res) => {
  const { productId } = req.body || {};
  if (!db.products.some((p) => p.id === productId)) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.wishlists[req.user.id] ??= [];
  if (!db.wishlists[req.user.id].includes(productId)) {
    db.wishlists[req.user.id].push(productId);
    save();
  }
  res.json(wishlistResponse(req.user.id));
});

router.delete('/:productId', (req, res) => {
  const ids = db.wishlists[req.user.id] ?? [];
  db.wishlists[req.user.id] = ids.filter((id) => id !== req.params.productId);
  save();
  res.json(wishlistResponse(req.user.id));
});

export default router;
