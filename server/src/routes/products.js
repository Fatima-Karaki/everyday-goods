import express from 'express';
import { db } from '../db.js';

const router = express.Router();

export function withStock(product) {
  const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  return { ...product, stock };
}

router.get('/', (req, res) => {
  res.json({ products: db.products.map(withStock) });
});

router.get('/:id', (req, res) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product: withStock(product) });
});

export default router;
