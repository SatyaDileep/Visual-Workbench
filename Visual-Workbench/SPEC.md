# Visual Workbench - Specification

## Overview

AI-powered presentation builder that generates premium HTML/CSS slides from natural language chat. Real-time preview, 11 aesthetic styles, PowerPoint export.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Hono (Node.js) |
| State | Zustand with localStorage persistence |
| Export | Python + python-pptx |
| AI | Any model via opencode (Gemini, GPT, Claude) |

## Core Features

### 1. Chat Interface
- Real-time streaming of AI responses
- Thinking/reasoning visualization with expandable sections
- Timer showing generation time
- Clipboard image paste for reference screenshots
- Independent message history per screen

### 2. Live HTML Viewer
- Sandboxed iframe rendering (srcdoc)
- Full animation and CSS support
- 16:9 aspect ratio default
- Instant preview on AI output

### 3. Screen Management
- Horizontal carousel with thumbnails
- Create, rename, delete screens
- Per-screen chat context
- LocalStorage persistence

### 4. Theme System
- Light and dark modes
- Theme toggle in header
- Persisted preference

### 5. Export
- One-click PowerPoint conversion
- Python script converts HTML screens to .pptx
- One slide per screen

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /auth/google | Initiate Google OAuth |
| GET | /auth/callback | OAuth callback |
| GET | /auth/me | Current user info |
| POST | /auth/logout | Clear session |
| GET | /models | List available AI models |
| POST | /chat | Send message (streaming response) |
| GET | /screens | List all screens |
| POST | /screens | Create new screen |
| GET | /screens/:id | Get screen with messages |
| PUT | /screens/:id | Update screen HTML |
| DELETE | /screens/:id | Delete screen |
| GET | /screens/:id/messages | Get chat history |

## Data Models

### Screen
```typescript
interface Screen {
  id: string;
  name: string;
  html: string;
  createdAt: number;
  updatedAt: number;
}
```

### Message
```typescript
interface Message {
  id: string;
  screenId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}
```

## Design System

### Wrapper UI
- Clean, minimal, professional
- Light: White backgrounds, subtle shadows
- Dark: #0a0a0a backgrounds, minimal glows
- System fonts (no custom fonts for wrapper)

### Generated Slides
The AI follows `frontend-design-pro` skill guidelines:
- 11 aesthetic directions (Minimalist, Glassmorphism, Brutalism, etc.)
- Characterful fonts (never Inter/Roboto/Arial)
- CSS custom properties
- Signature details (grain, mesh gradients, custom cursors)
- WCAG AA accessible
- Real images from Unsplash/Pexels

## Non-Functional Requirements

1. **Performance**: Instant HTML preview, <100ms render latency
2. **Offline**: All screens stored locally, survive refresh
3. **Streaming**: Visible thinking stream with time counter
4. **Security**: No API keys in UI, all through backend
5. **Accessibility**: WCAG AA for wrapper UI

## File Structure

```
Visual-Workbench/
├── ui/                          # React frontend
│   ├── src/
│   │   ├── components/          # Chat, Viewer, Carousel
│   │   ├── stores/              # Zustand state
│   │   └── styles/              # Theme system
│   └── package.json
├── server/                      # Hono backend
│   ├── src/
│   │   ├── routes/              # Auth, chat, screens, export
│   │   └── services/            # AI provider, Google auth
│   └── package.json
├── skills/                      # AI design skills
│   ├── frontend-design-pro/     # 11 aesthetic style guide
│   └── visual-workbench/        # Slide generation rules
├── examples/demos-v02/          # 11 reference demos
├── scripts/                     # Export tools
└── SPEC.md                      # This file
```
