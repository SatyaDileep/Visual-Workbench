import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageData?: string;
}

interface StreamOptions {
  messages: ChatMessage[];
  model: string;
  screenId: string;
  images?: string[];
  onThinking: (text: string) => Promise<void>;
  onCode: (code: string) => Promise<void>;
  onComplete: (text: string) => Promise<void>;
}

const SYSTEM_PROMPT = `You are the AI engine powering Visual Workbench - a presentation screen generator.

Your task is to create stunning, production-ready HTML/CSS screens based on user instructions.

CRITICAL DESIGN RULES - Follow these for EVERY screen:

1. USE THE FRONTEND-DESIGN-PRO SKILL
   You have access to skills/frontend-design-pro/SKILL.md which defines 11 aesthetic styles.
   ALWAYS reference this when generating screens.

2. DEFAULT TO MINIMALISM & SWISS STYLE (most enticing for presentations)
   - clean, swiss, grid-based, generous whitespace
   - Monochrome + one bold accent
   - Razor-sharp hierarchy, subtle hover lifts

3. GLASSMORPHISM IS ALSO EXCELLENT FOR MODERN LOOKS
   - frosted glass, backdrop-filter blur
   - vibrant backdrop with translucent overlays

4. NEVER USE THESE FONTS: Inter, Roboto, Arial, system-ui
   USE: GT America, Satoshi, Clash Display, Neue Machina, or similar characterful fonts

5. CSS CUSTOM PROPERTIES EVERYWHERE
   Define colors, fonts, spacing as CSS variables

6. PERFECT IMAGES
   Use real Unsplash URLs: https://images.unsplash.com/photo-XXXXX?w=1920&q=80
   Never invent fake URLs

7. THE SCREEN MUST BE:
   - Pure HTML + CSS (no frameworks required)
   - Self-contained in one file
   - 16:9 aspect ratio for presentations
   - WCAG AA compliant
   - Include subtle animations

8. OUTPUT FORMAT
   When generating code, wrap it in [CODE] blocks.
   When thinking, use [THINKING] blocks for reasoning.

Example flow:
1. User asks for a slide
2. You think about the design direction
3. You generate HTML/CSS
4. Output code in [CODE] tags

Start with [THINKING] to explain your design choices.`;

export async function streamText(options: StreamOptions) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const contents: any[] = options.messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.imageData 
      ? [{ text: msg.content }, { inlineData: { mimeType: 'image/png', data: msg.imageData } }]
      : [{ text: msg.content }]
  }));

  if (contents.length === 0 || contents[0].role !== 'model') {
    contents.unshift({
      role: 'model',
      parts: [{ text: SYSTEM_PROMPT }]
    });
  }

  try {
    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7
      }
    });

    let fullResponse = '';
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullResponse += text;
      
      if (text.includes('```html') || text.includes('[CODE]')) {
        await options.onCode(text);
      } else if (text.includes('[THINKING]') || fullResponse.match(/\[THINKING\]/)) {
        await options.onThinking(text);
      } else {
        await options.onThinking(text);
      }
    }

    await options.onComplete(fullResponse);
  } catch (error) {
    console.error('AI streaming error:', error);
    throw error;
  }
}