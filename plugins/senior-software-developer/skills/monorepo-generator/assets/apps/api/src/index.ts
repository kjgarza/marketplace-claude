import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => c.json({ status: 'ok' }));
app.get('/health', (c) => c.json({ healthy: true, timestamp: new Date().toISOString() }));

// Example routes - replace with your own
app.get('/api/users', (c) => {
  return c.json({ users: [] });
});

app.post('/api/users', async (c) => {
  const body = await c.req.json();
  return c.json({ created: true, user: body }, 201);
});

// Start server
const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API running on http://localhost:${info.port}`);
});

export default app;
