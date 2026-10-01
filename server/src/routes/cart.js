import express from 'express';
import { db, save } from '../db.js';

const router = express.Router();

function getCart(userId) {
  db.carts[userId] ??= [];
  return db.carts[userId];
}

function findVariant(productId, variantId) {
  const product = db.products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  return { product, variant };
}

function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0;
}

function stockError(variant) {
  return variant.stock === 0 ? 'This item is out of stock' : `Only ${variant.stock} left in stock`;
}

function cartResponse(userId) {
  const items = [];
  for (const item of getCart(userId)) {
    const { product, variant } = findVariant(item.productId, item.variantId);
    if (!variant) continue;
    items.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      image: product.image,
      unitPrice: product.price,
      quantity: item.quantity,
      stock: variant.stock,
      subtotal: product.price * item.quantity,
    });
  }
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, total };
}

router.get('/', (req, res) => {
  res.json(cartResponse(req.user.id));
});

router.post('/items', (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body || {};
  const { product, variant } = findVariant(productId, variantId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (!variant) {
    return res.status(400).json({ error: 'Invalid variant for this product' });
  }
  if (!isValidQuantity(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  const cart = getCart(req.user.id);
  const existing = cart.find((item) => item.variantId === variantId);
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  if (newQuantity > variant.stock) {
    return res.status(409).json({ error: stockError(variant) });
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.push({ productId, variantId, quantity });
  }
  save();
  res.json(cartResponse(req.user.id));
});

router.patch('/items/:variantId', (req, res) => {
  const { quantity } = req.body || {};
  const item = getCart(req.user.id).find((i) => i.variantId === req.params.variantId);

  if (!item) {
    return res.status(404).json({ error: 'Item not in cart' });
  }
  if (!isValidQuantity(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  const { variant } = findVariant(item.productId, item.variantId);
  if (quantity > variant.stock) {
    return res.status(409).json({ error: stockError(variant) });
  }

  item.quantity = quantity;
  save();
  res.json(cartResponse(req.user.id));
});

router.delete('/items/:variantId', (req, res) => {
  db.carts[req.user.id] = getCart(req.user.id).filter((i) => i.variantId !== req.params.variantId);
  save();
  res.json(cartResponse(req.user.id));
});

export default router;
