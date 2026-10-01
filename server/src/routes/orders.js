import express from 'express';
import { randomUUID } from 'node:crypto';
import { db, save } from '../db.js';

const router = express.Router();

const addressFields = ['fullName', 'address', 'city', 'postalCode', 'country'];

router.post('/', (req, res) => {
  const address = req.body?.shippingAddress ?? {};
  const missing = addressFields.filter((f) => typeof address[f] !== 'string' || !address[f].trim());
  if (missing.length) {
    return res.status(400).json({ error: 'Shipping address is incomplete', fields: missing });
  }

  const userId = req.user.id;
  const cart = db.carts[userId] ?? [];
  if (!cart.length) {
    return res.status(400).json({ error: 'Your cart is empty' });
  }

  const lines = [];
  const unavailable = [];
  for (const item of cart) {
    const product = db.products.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!variant || variant.stock < item.quantity) {
      unavailable.push({
        productId: item.productId,
        variantId: item.variantId,
        name: product?.name,
        requested: item.quantity,
        available: variant?.stock ?? 0,
      });
    } else {
      lines.push({ product, variant, quantity: item.quantity });
    }
  }

  if (unavailable.length) {
    return res.status(409).json({
      error: 'Some items in your cart are no longer available in the requested quantity',
      items: unavailable,
    });
  }

  const items = lines.map(({ product, variant, quantity }) => {
    variant.stock -= quantity;
    return {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      image: product.image,
      unitPrice: product.price,
      quantity,
      subtotal: product.price * quantity,
    };
  });

  const order = {
    id: randomUUID(),
    userId,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    shippingAddress: Object.fromEntries(addressFields.map((f) => [f, address[f].trim()])),
  };

  db.orders.push(order);
  db.carts[userId] = [];
  save();

  res.status(201).json({ order });
});

router.get('/:id', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === req.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
});

export default router;
