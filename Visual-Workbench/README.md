# Visual Workbench

AI-powered presentation screen generator with premium design quality.

## Quick Start

### 1. Start opencode server (terminal 1)
```bash
opencode serve --cors http://localhost:5173
```

### 2. Start the UI (terminal 2)
```bash
cd Visual-Workbench/ui
npm run dev
```

### 3. Open browser
Navigate to `http://localhost:5173`

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser UI                     │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │   Chat Panel    │  │    Viewer Panel     │   │
│  │   (messages)    │  │   (HTML preview)    │   │
│  └────────┬────────┘  └─────────────────────┘   │
│           │                                       │
│           │ HTTP/WebSocket                       │
└───────────┼─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────┐
│           opencode serve (localhost:4096)        │
│   - Handles auth (your configured providers)    │
│   - Routes to Gemini/GPT/Claude/etc.            │
│   - Manages sessions and context                │
└─────────────────────────────────────────────────┘
```

## Features

- **Theme Toggle**: Light/Dark mode
- **Screen Carousel**: Navigate between slides
- **Live Preview**: See HTML/CSS rendered instantly
- **Clipboard Images**: Paste screenshots directly
- **Design Skills**: Uses `frontend-design-pro` for premium aesthetics

## Project Structure

```
Visual-Workbench/
├── ui/                     # React frontend
│   ├── src/
│   │   ├── components/     # Chat, Viewer, Carousel
│   │   ├── stores/         # Zustand state
│   │   └── styles/         # Themes
│   └── dist/               # Built output
├── skills/                 # Design skills
│   ├── frontend-design-pro/
│   └── visual-workbench/
├── examples/              # 11 demo screens
├── scripts/               # Export tools
└── SPEC.md                # Full specification
```

## Requirements

- opencode CLI (`npm install -g opencode-ai`)
- Node.js 18+
- Configured model providers in opencode

## Design Styles

The AI generates screens using these aesthetic directions:

| # | Style | Keywords |
|---|-------|----------|
| 01 | Minimalism & Swiss | clean, swiss, grid-based |
| 02 | Neumorphism | soft ui, embossed |
| 03 | Glassmorphism | frosted glass, blur |
| 04 | Brutalism | raw, high contrast |
| 05 | Claymorphism | clay, bubbly |
| 06 | Aurora/Mesh | mesh gradient |
| 07 | Retro-Futurism | neon, cyberpunk |
| 08 | 3D Hyperrealism | realistic |
| 09 | Vibrant Block | bold, maximalist |
| 10 | Dark OLED Luxury | deep black |
| 11 | Organic/Biomorphic | fluid shapes |

## PPT Export

Install python-pptx:
```bash
pip install python-pptx
```

The export button calls `scripts/export-ppt.py` to convert screens to PowerPoint.