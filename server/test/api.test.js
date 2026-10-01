import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shop-test-'));
process.env.DB_FILE = path.join(tmpDir, 'db.json');

const { default: app } = await import('../src/app.js');
const { db } = await import('../src/db.js');

const address = {
  fullName: 'Demo User',
  address: '12 Market Street',
  city: 'Beirut',
  postalCode: '1107',
  country: 'Lebanon',
};

async function login() {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: 'demo@example.com', password: 'password123' })
    .expect(200);
  return agent;
}

function variantStock(variantId) {
  return db.products.flatMap((p) => p.variants).find((v) => v.id === variantId).stock;
}

beforeEach(() => {
  db.carts = {};
  db.wishlists = {};
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('lists 15 products with variants and stock', async () => {
  const res = await request(app).get('/api/products').expect(200);
  assert.equal(res.body.products.length, 15);
  assert.ok(res.body.products.filter((p) => p.variants.length > 1).length >= 3);
  for (const p of res.body.products) {
    assert.ok(p.id && p.name && p.description && p.image);
    assert.ok(Number.isInteger(p.price));
    assert.equal(p.stock, p.variants.reduce((sum, v) => sum + v.stock, 0));
  }
});

test('returns product details or 404', async () => {
  const res = await request(app).get('/api/products/p1').expect(200);
  assert.equal(res.body.product.name, 'Fresh Apples 1kg');
  assert.equal(res.body.product.variants.length, 4);

  const missing = await request(app).get('/api/products/nope').expect(404);
  assert.equal(missing.body.error, 'Product not found');
});

test('rejects unauthenticated access to protected routes', async () => {
  await request(app).get('/api/auth/me').expect(401);
  await request(app).get('/api/cart').expect(401);
  await request(app).post('/api/cart/items').send({}).expect(401);
  await request(app).get('/api/wishlist').expect(401);
  await request(app).post('/api/orders').send({}).expect(401);

  const res = await request(app).get('/api/cart').set('Cookie', 'token=garbage').expect(401);
  assert.ok(res.body.error);
});

test('login validates credentials and sets an httpOnly cookie', async () => {
  await request(app).post('/api/auth/login').send({}).expect(400);

  const bad = await request(app)
    .post('/api/auth/login')
    .send({ email: 'demo@example.com', password: 'wrong' })
    .expect(401);
  assert.equal(bad.body.error, 'Invalid email or password');

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'Demo@Example.com', password: 'password123' })
    .expect(200);
  assert.deepEqual(res.body.user, { id: 'u1', email: 'demo@example.com', name: 'Demo User' });
  assert.match(res.headers['set-cookie'][0], /token=.+; .*HttpOnly/);
  assert.equal(res.body.user.passwordHash, undefined);
});

test('me returns the user, logout ends the session', async () => {
  const agent = await login();
  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.email, 'demo@example.com');

  await agent.post('/api/auth/logout').expect(204);
  await agent.get('/api/auth/me').expect(401);
});

test('each user has their own cart', async () => {
  const demo = await login();
  const alex = request.agent(app);
  const res = await alex
    .post('/api/auth/login')
    .send({ email: 'alex@example.com', password: 'alex1234' })
    .expect(200);
  assert.equal(res.body.user.name, 'Alex Morgan');

  await demo.post('/api/cart/items').send({ productId: 'p8', variantId: 'p8-std' }).expect(200);
  const alexCart = await alex.get('/api/cart').expect(200);
  assert.equal(alexCart.body.items.length, 0);
});

test('cart add, merge, update, remove with totals', async () => {
  const agent = await login();

  let res = await agent.post('/api/cart/items').send({ productId: 'p1', variantId: 'p1-fuji', quantity: 2 }).expect(200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].subtotal, 698);

  await agent.post('/api/cart/items').send({ productId: 'p8', variantId: 'p8-std' }).expect(200);
  res = await agent.post('/api/cart/items').send({ productId: 'p1', variantId: 'p1-fuji', quantity: 1 }).expect(200);
  assert.equal(res.body.items.length, 2);
  assert.equal(res.body.items[0].quantity, 3);
  assert.equal(res.body.total, 349 * 3 + 450);

  res = await agent.patch('/api/cart/items/p1-fuji').send({ quantity: 5 }).expect(200);
  assert.equal(res.body.items[0].quantity, 5);
  assert.equal(res.body.total, 349 * 5 + 450);

  res = await agent.delete('/api/cart/items/p8-std').expect(200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.total, 349 * 5);

  res = await agent.get('/api/cart').expect(200);
  assert.equal(res.body.items[0].variantLabel, 'Fuji');
  assert.equal(variantStock('p1-fuji'), 20);
});

test('cart validation errors', async () => {
  const agent = await login();

  let res = await agent.post('/api/cart/items').send({ productId: 'nope', variantId: 'x' }).expect(404);
  assert.equal(res.body.error, 'Product not found');

  res = await agent.post('/api/cart/items').send({ productId: 'p1', variantId: 'p2-whole' }).expect(400);
  assert.equal(res.body.error, 'Invalid variant for this product');

  for (const quantity of [0, -1, 1.5, '2', null]) {
    await agent.post('/api/cart/items').send({ productId: 'p1', variantId: 'p1-fuji', quantity }).expect(400);
  }

  res = await agent.post('/api/cart/items').send({ productId: 'p1', variantId: 'p1-pinklady' }).expect(409);
  assert.equal(res.body.error, 'This item is out of stock');

  res = await agent.post('/api/cart/items').send({ productId: 'p2', variantId: 'p2-lactosefree', quantity: 3 }).expect(409);
  assert.equal(res.body.error, 'Only 2 left in stock');

  await agent.post('/api/cart/items').send({ productId: 'p2', variantId: 'p2-lactosefree', quantity: 2 }).expect(200);
  await agent.post('/api/cart/items').send({ productId: 'p2', variantId: 'p2-lactosefree', quantity: 1 }).expect(409);
  await agent.patch('/api/cart/items/p2-lactosefree').send({ quantity: 3 }).expect(409);
  await agent.patch('/api/cart/items/p2-lactosefree').send({ quantity: 0 }).expect(400);
  await agent.patch('/api/cart/items/p1-gala').send({ quantity: 1 }).expect(404);

  await agent.post('/api/cart/items').set('Content-Type', 'application/json').send('{bad').expect(400);
});

test('wishlist add, dedupe, remove', async () => {
  const agent = await login();

  await agent.post('/api/wishlist').send({ productId: 'p3' }).expect(200);
  let res = await agent.post('/api/wishlist').send({ productId: 'p3' }).expect(200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].id, 'p3');

  await agent.post('/api/wishlist').send({ productId: 'nope' }).expect(404);

  res = await agent.get('/api/wishlist').expect(200);
  assert.equal(res.body.items.length, 1);

  res = await agent.delete('/api/wishlist/p3').expect(200);
  assert.equal(res.body.items.length, 0);
});

test('checkout rejects empty cart and incomplete address', async () => {
  const agent = await login();

  let res = await agent.post('/api/orders').send({ shippingAddress: address }).expect(400);
  assert.equal(res.body.error, 'Your cart is empty');

  await agent.post('/api/cart/items').send({ productId: 'p10', variantId: 'p10-std' }).expect(200);
  res = await agent.post('/api/orders').send({ shippingAddress: { ...address, city: '  ' } }).expect(400);
  assert.deepEqual(res.body.fields, ['city']);
});

test('successful checkout reduces stock, clears cart and returns the order', async () => {
  const agent = await login();
  const stockBefore = variantStock('p5-mild');

  await agent.post('/api/cart/items').send({ productId: 'p5', variantId: 'p5-mild', quantity: 2 }).expect(200);
  await agent.post('/api/cart/items').send({ productId: 'p15', variantId: 'p15-honeynut', quantity: 3 }).expect(200);
  assert.equal(variantStock('p5-mild'), stockBefore);

  const res = await agent.post('/api/orders').send({ shippingAddress: address }).expect(201);
  const { order } = res.body;
  assert.equal(order.status, 'confirmed');
  assert.equal(order.items.length, 2);
  assert.equal(order.total, 1299 * 2 + 399 * 3);
  assert.equal(order.shippingAddress.city, 'Beirut');

  assert.equal(variantStock('p5-mild'), stockBefore - 2);
  const cart = await agent.get('/api/cart').expect(200);
  assert.equal(cart.body.items.length, 0);

  const fetched = await agent.get(`/api/orders/${order.id}`).expect(200);
  assert.equal(fetched.body.order.id, order.id);
  await agent.get('/api/orders/does-not-exist').expect(404);

  const saved = JSON.parse(fs.readFileSync(process.env.DB_FILE, 'utf8'));
  assert.ok(saved.orders.some((o) => o.id === order.id));
});

test('checkout with insufficient stock rejects the whole order', async () => {
  const agent = await login();

  await agent.post('/api/cart/items').send({ productId: 'p7', variantId: 'p7-medium', quantity: 1 }).expect(200);
  await agent.post('/api/cart/items').send({ productId: 'p12', variantId: 'p12-std', quantity: 2 }).expect(200);

  // Simulate another customer buying the chocolate after it was added to this cart.
  db.products.find((p) => p.id === 'p12').variants[0].stock = 1;
  const coffeeStock = variantStock('p7-medium');
  const ordersBefore = db.orders.length;

  const res = await agent.post('/api/orders').send({ shippingAddress: address }).expect(409);
  assert.deepEqual(res.body.items, [
    { productId: 'p12', variantId: 'p12-std', name: 'Dark Chocolate 70% 100g', requested: 2, available: 1 },
  ]);

  assert.equal(variantStock('p7-medium'), coffeeStock);
  assert.equal(variantStock('p12-std'), 1);
  assert.equal(db.orders.length, ordersBefore);
  const cart = await agent.get('/api/cart').expect(200);
  assert.equal(cart.body.items.length, 2);
});

test('unknown api routes return 404 json', async () => {
  const res = await request(app).get('/api/unknown').expect(404);
  assert.equal(res.body.error, 'Not found');
});
