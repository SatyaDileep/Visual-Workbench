import { Hono } from 'hono';
import { GoogleAuth } from '../services/google-auth';

const auth = new GoogleAuth();
const routes = new Hono();

routes.get('/google', (c) => {
  return c.redirect(auth.getAuthUrl());
});

routes.get('/callback', async (c) => {
  const code = c.query('code');
  if (!code) return c.json({ error: 'No code provided' }, 400);
  
  try {
    const tokens = await auth.getTokens(code);
    const user = await auth.getUser(tokens.access_token);
    
    return c.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      user
    });
  } catch (err) {
    return c.json({ error: 'Auth failed' }, 401);
  }
});

routes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.slice(7);
  try {
    const user = await auth.getUser(token);
    return c.json(user);
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

routes.post('/logout', (c) => {
  return c.json({ success: true });
});

export { routes as authRoutes };