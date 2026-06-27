# Visual Workbench - Specification

AI-powered presentation screen generator with premium design quality.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Hono (Node.js) + WebSocket |
| Storage | IndexedDB (client) |
| Export | Python + python-pptx |

## Features

### 1. Authentication
- Google OAuth sign-in
- Session token-based auth
- Protected workspace (login gate)

### 2. Two-Pane Layout
```
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│      CHAT PANE          │     VIEWER PANE         │
│   (with streaming)      │   (HTML sandbox)        │
│                         │                         │
│  ┌─────────────────┐    │  ┌─────────────────┐    │
│  │ Message History │    │  │                 │    │
│  │                 │    │  │  Live Preview   │    │
│  │ [Claude thinking│    │  │  16:9 ratio     │    │
│  │  streaming...]  │    │  │                 │    │
│  └─────────────────┘    │  └─────────────────┘    │
│                         │                         │
│  ┌─────────────────┐    │  ┌─────────────────┐    │
│  │ Input + Send    │    │  │ Reimagine btn   │    │
│  │ [clipboard btn] │    │  └─────────────────┘    │
│  └─────────────────┘    │                         │
├─────────────────────────┴─────────────────────────┤
│              SCREEN CAROUSEL                     │
│  ◄ [Slide 1] [Slide 2] [Slide 3] ►   [Export PPT]│
└───────────────────────────────────────────────────┘
```

### 3. Chat Interface
- Real-time streaming of AI responses (thinking + code)
- Timer showing time taken for generation
- Clipboard image upload button (paste screenshots)
- Message history per screen (independent contexts)
- Agent can ask clarifying questions when needed

### 4. HTML Viewer
- Secure sandbox (iframe with srcdoc)
- Full animation support
- 16:9 aspect ratio default
- Responsive within pane

### 5. Screen Carousel
- Horizontal scrollable thumbnails
- Arrow navigation
- Click to switch active screen
- New screen button
- Delete screen option

### 6. Theme System
- Light (default) and Dark modes
- Theme toggle in header
- Persisted in localStorage

### 7. Export
- "Export to PPT" button
- Python script converts HTML screens to PowerPoint
- One slide per screen

## Design System

### UI Wrapper Style
- Clean, minimal, professional
- Light: White backgrounds, subtle shadows
- Dark: #0a0a0a backgrounds, minimal glows
- Font: System-safe (no custom fonts for wrapper)

### Agent Instructions
System prompt instructs AI to use `frontend-design-pro` skill:
- Minimalism & Swiss Style (default, enticing)
- Glassmorphism (frosted glass effects)
- 11 total aesthetic options

### Generated Screen Styles
Agent generates using frontend-design-pro guidelines:
- Characterful fonts
- Signature details (grain, effects)
- Perfect images (Unsplash/Pexels)
- WCAG AA compliant

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /auth/google | Initiate Google OAuth |
| GET | /auth/callback | OAuth callback |
| GET | /auth/me | Current user info |
| POST | /auth/logout | Clear session |
| GET | /models | List available models |
| POST | /chat | Send message (streaming) |
| GET | /screens | List all screens |
| POST | /screens | Create new screen |
| GET | /screens/:id | Get screen + messages |
| PUT | /screens/:id | Update screen HTML |
| DELETE | /screens/:id | Delete screen |
| GET | /screens/:id/messages | Get chat history |

## Data Model

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

## Non-Functional Requirements

1. **Performance**: Instant HTML preview updates, <100ms render latency
2. **Offline**: All screens stored locally, survive refresh
3. **Streaming**: Visible thinking stream, time counter
4. **Security**: No API keys in UI, all through backend
5. **Accessibility**: WCAG AA for wrapper UI

## File Structure

```
visual-workbench/
├── ui/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── styles/
│   ├── index.html
│   └── vite.config.ts
├── server/                 # Hono backend
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   └── package.json
├── scripts/
│   └── export-ppt.py
├── skills/                 # Design skills
│   ├── frontend-design-pro/
│   └── visual-workbench/
├── examples/               # Demo screens
└── SPEC.md
```