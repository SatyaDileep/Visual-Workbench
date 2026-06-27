import { Hono } from 'hono';
import { streamText } from '../services/ai-provider';

const routes = new Hono();

routes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { messages, model, screenId, images } = await c.req.json();
  
  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: 'Invalid messages' }, 400);
  }

  return c.streamText(async (stream) => {
    await streamText({
      messages,
      model: model || 'gemini-pro',
      screenId,
      images,
      onThinking: async (text) => {
        await stream.write(`[THINKING]${text}[/THINKING]`);
      },
      onCode: async (code) => {
        await stream.write(`[CODE]${code}[/CODE]`);
      },
      onComplete: async (fullResponse) => {
        await stream.write(`[COMPLETE]${fullResponse}[/COMPLETE]`);
      }
    });
  });
});

export { routes as chatRoutes };