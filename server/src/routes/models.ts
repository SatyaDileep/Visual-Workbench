import { Hono } from 'hono';

const routes = new Hono();

routes.get('/', (c) => {
  return c.json([
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      capabilities: ['chat', 'streaming']
    },
    {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision',
      provider: 'google',
      capabilities: ['chat', 'vision', 'streaming']
    }
  ]);
});

export { routes as modelsRoutes };