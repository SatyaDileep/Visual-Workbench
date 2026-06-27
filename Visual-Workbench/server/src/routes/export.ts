import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);
const routes = new Hono();

routes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { screens } = await c.req.json();
  
  if (!screens || !Array.isArray(screens)) {
    return c.json({ error: 'Invalid screens data' }, 400);
  }

  try {
    const tempFile = join(process.cwd(), 'temp-screens.json');
    await writeFile(tempFile, JSON.stringify(screens));

    const scriptPath = join(process.cwd(), '../../scripts/export-ppt.py');
    const { stdout } = await execAsync(`python "${scriptPath}" "${tempFile}" "presentation.pptx"`);
    
    await unlink(tempFile).catch(() => {});

    return c.json({ success: true, message: stdout });
  } catch (err) {
    console.error('Export error:', err);
    return c.json({ error: 'Export failed', details: String(err) }, 500);
  }
});

export { routes as exportRoutes };