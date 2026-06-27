import { Hono } from 'hono';
import { z } from 'zod';

const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
  html: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

const routes = new Hono();

routes.get('/', (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const screensJson = c.req.header('X-Screens');
  const screens = screensJson ? JSON.parse(decodeURIComponent(screensJson)) : [];
  return c.json(screens);
});

routes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const newScreen = {
    id: crypto.randomUUID(),
    name: body.name || 'Untitled Screen',
    html: body.html || '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  return c.json(newScreen, 201);
});

routes.get('/:id', (c) => {
  const screensJson = c.req.header('X-Screens');
  const screens = screensJson ? JSON.parse(decodeURIComponent(screensJson)) : [];
  const screen = screens.find((s: any) => s.id === c.param('id'));
  
  if (!screen) return c.json({ error: 'Not found' }, 404);
  return c.json(screen);
});

routes.put('/:id', async (c) => {
  const screensJson = c.req.header('X-Screens');
  const screens = screensJson ? JSON.parse(decodeURIComponent(screensJson)) : [];
  const body = await c.req.json();
  
  const screenIndex = screens.findIndex((s: any) => s.id === c.param('id'));
  if (screenIndex === -1) return c.json({ error: 'Not found' }, 404);
  
  screens[screenIndex] = {
    ...screens[screenIndex],
    ...body,
    updatedAt: Date.now()
  };
  
  return c.json(screens[screenIndex]);
});

routes.delete('/:id', (c) => {
  return c.json({ success: true });
});

routes.get('/:id/messages', (c) => {
  return c.json([]);
});

export { routes as screensRoutes };