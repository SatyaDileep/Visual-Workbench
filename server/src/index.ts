import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from 'hono/node';
import { chatRoutes } from './routes/chat';
import { authRoutes } from './routes/auth';
import { screensRoutes } from './routes/screens';
import { modelsRoutes } from './routes/models';
import { exportRoutes } from './routes/export';

const app = new Hono();

app.use('/*', cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.get('/', (c) => c.json({ status: 'ok', service: 'visual-workbench-api' }));

app.route('/auth', authRoutes);
app.route('/models', modelsRoutes);
app.route('/chat', chatRoutes);
app.route('/screens', screensRoutes);
app.route('/export', exportRoutes);

const port = 3001;
console.log(`Visual Workbench API running on port ${port}`);

serve({ fetch: app.fetch, port });