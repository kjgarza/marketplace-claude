---
name: chrome-extension-builder
description: Scaffold and setup Chrome MV3 extensions using WXT framework with React, TypeScript, and shadcn-UI. Use when creating new browser extensions, setting up content scripts, background service workers, side panels, popups, or configuring native messaging. Supports Google Docs/Overleaf integrations, DOM extraction, and cross-context communication patterns.
---

# Chrome Extension Builder

Scaffold production-ready Chrome MV3 extensions using WXT + React + shadcn-UI.

## Quick Start

```bash
pnpm dlx wxt@latest init <project-name> --template react
cd <project-name>
pnpm install
pnpm dev
```

---

## Workflow

### Step 1: Gather Requirements

Ask user about extension type and features:

| Component | Purpose | When to Include |
|-----------|---------|-----------------|
| **Background** | Service worker, messaging hub, native messaging | Always |
| **Content Script** | DOM manipulation, page extraction | Interacting with web pages |
| **Side Panel** | Persistent UI alongside pages | Complex UIs, suggestion panels |
| **Popup** | Quick actions, settings access | Simple interactions |
| **Options Page** | Extension configuration | User preferences |
| **DevTools Panel** | Developer debugging tools | Development tooling |

### Step 2: Create Project Structure

```
/extension
├── entrypoints/
│   ├── background.ts           # Service worker
│   ├── popup/                   # Popup UI (optional)
│   │   ├── index.html
│   │   ├── App.tsx
│   │   └── style.css
│   ├── sidepanel/              # Side panel UI (optional)
│   │   ├── index.html
│   │   ├── App.tsx
│   │   └── style.css
│   └── options/                # Options page (optional)
│       ├── index.html
│       └── App.tsx
├── content/                    # Content scripts
│   ├── main.ts                 # Primary content script
│   └── [site-name].ts          # Site-specific scripts
├── lib/                        # Shared utilities
│   ├── storage.ts              # Storage wrapper
│   ├── messaging.ts            # Message protocol
│   └── types.ts                # Shared types
├── components/                 # React components (shadcn-ui)
│   └── ui/
├── wxt.config.ts              # WXT configuration
├── tailwind.config.js         # Tailwind CSS
├── package.json
└── tsconfig.json
```

### Step 3: Configure WXT

**wxt.config.ts:**
```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Extension Name',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['https://example.com/*'],
  },
});
```

See [WXT Configuration Reference](./references/wxt-config.md) for complete options.

### Step 4: Implement Components

#### Background Service Worker

```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  console.log('Extension loaded');

  // Message handler
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_DATA') {
      // Handle message
      sendResponse({ success: true, data: {} });
    }
    return true; // Keep channel open for async response
  });
});
```

#### Content Script

```typescript
// content/main.ts
export default defineContentScript({
  matches: ['https://example.com/*'],
  main(ctx) {
    console.log('Content script loaded on', window.location.href);

    // Extract page data
    const pageData = extractPageContent();

    // Send to background
    browser.runtime.sendMessage({ type: 'PAGE_DATA', data: pageData });
  },
});
```

#### Side Panel with React

```tsx
// entrypoints/sidepanel/App.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function App() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for messages from background
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'NEW_DATA') {
        setData(prev => [message.data, ...prev]);
      }
    });
  }, []);

  const handleAction = async () => {
    setLoading(true);
    const response = await browser.runtime.sendMessage({ type: 'RUN_ACTION' });
    setLoading(false);
  };

  return (
    <div className="p-4">
      <Button onClick={handleAction} disabled={loading}>
        {loading ? 'Processing...' : 'Run Action'}
      </Button>
      {data.map((item) => (
        <Card key={item.id} className="mt-2 p-3">
          {item.content}
        </Card>
      ))}
    </div>
  );
}
```

---

## Common Patterns

### Storage Wrapper

```typescript
// lib/storage.ts
import { storage } from 'wxt/storage';

export interface DocState {
  docId: string;
  title: string;
  lastRunAt: number;
  items: Item[];
  dismissedIds: string[];
}

const docStateKey = (id: string) => `local:doc:${id}` as const;

export const docStorage = {
  async get(docId: string): Promise<DocState | null> {
    return storage.getItem<DocState>(docStateKey(docId));
  },

  async set(docId: string, state: DocState): Promise<void> {
    await storage.setItem(docStateKey(docId), state);
  },

  watch(docId: string, callback: (state: DocState | null) => void) {
    return storage.watch<DocState>(docStateKey(docId), callback);
  },
};
```

### Message Protocol

```typescript
// lib/messaging.ts
export const PROTOCOL_VERSION = '1.0.0';

export type MessageType =
  | { type: 'DOC_OPEN'; doc: DocPayload }
  | { type: 'DOC_CHUNK'; docId: string; chunk: string; index: number }
  | { type: 'DOC_DONE'; docId: string }
  | { type: 'SUGGESTIONS'; docId: string; items: Suggestion[] }
  | { type: 'INSERT_FIX'; suggestionId: string }
  | { type: 'ERROR'; code: string; message: string };

export async function sendMessage<T extends MessageType>(
  message: T
): Promise<MessageResponse<T>> {
  return browser.runtime.sendMessage({ ...message, protocolVersion: PROTOCOL_VERSION });
}
```

### Native Messaging (Optional)

```typescript
// lib/nativeAdapter.ts
export interface NativeAdapter {
  connect(): Promise<void>;
  send(message: unknown): void;
  onMessage(callback: (msg: unknown) => void): void;
  disconnect(): void;
}

export function createNativeAdapter(appName: string): NativeAdapter {
  let port: browser.Runtime.Port | null = null;

  return {
    connect() {
      port = browser.runtime.connectNative(appName);
      return Promise.resolve();
    },
    send(message) {
      port?.postMessage(message);
    },
    onMessage(callback) {
      port?.onMessage.addListener(callback);
    },
    disconnect() {
      port?.disconnect();
      port = null;
    },
  };
}

// Mock adapter for development
export function createMockAdapter(): NativeAdapter {
  return {
    async connect() {},
    send(message) {
      // Simulate response after delay
      setTimeout(() => {
        // Return mock data
      }, 1000);
    },
    onMessage(callback) {},
    disconnect() {},
  };
}
```

### Content Script Insertion

```typescript
// content/insert.ts
export function insertText(text: string): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));

  // Collapse selection to end
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  return true;
}

// For contenteditable elements (Google Docs workaround)
export async function insertViaClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    document.execCommand('paste');
    return true;
  } catch {
    return false;
  }
}
```

### Shadow DOM UI in Content Scripts

```typescript
// content/overlay.ts
import { createShadowRootUi } from 'wxt/content-script-ui/shadow-root';
import { createRoot } from 'react-dom/client';
import Overlay from './Overlay';

export default defineContentScript({
  matches: ['https://example.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-overlay',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const root = createRoot(container);
        root.render(<Overlay />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
```

---

## Site-Specific Content Scripts

### Google Docs Extraction

```typescript
// content/gdocs.ts
export default defineContentScript({
  matches: ['https://docs.google.com/document/*'],

  main(ctx) {
    const docId = extractDocId(window.location.href);
    const title = document.title.replace(' - Google Docs', '');

    // Google Docs renders text in .kix-lineview elements
    const lines = document.querySelectorAll('.kix-lineview');
    const text = Array.from(lines)
      .map(el => el.textContent || '')
      .join('\n');

    const cursorContext = getCursorContext();
    const headings = extractHeadings();

    browser.runtime.sendMessage({
      type: 'DOC_OPEN',
      doc: { docId, title, text, cursorContext, headings },
    });
  },
});

function extractDocId(url: string): string {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || '';
}

function getCursorContext(): { before: string; after: string } {
  // Implementation depends on Google Docs DOM structure
  return { before: '', after: '' };
}

function extractHeadings(): { text: string; start: number }[] {
  // Extract heading elements
  return [];
}
```

### Overleaf Extraction

```typescript
// content/overleaf.ts
export default defineContentScript({
  matches: ['https://www.overleaf.com/project/*'],

  main(ctx) {
    const projectId = extractProjectId(window.location.href);

    // Overleaf uses CodeMirror - access editor content
    const editor = document.querySelector('.cm-content');
    const text = editor?.textContent || '';

    browser.runtime.sendMessage({
      type: 'DOC_OPEN',
      doc: { docId: projectId, title: document.title, text },
    });
  },
});

function extractProjectId(url: string): string {
  const match = url.match(/\/project\/([a-f0-9]+)/);
  return match?.[1] || '';
}
```

---

## UI Setup with shadcn-ui

### Initialize Tailwind + shadcn

```bash
# After WXT init
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p

# Add shadcn-ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card toast badge
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './entrypoints/**/*.{ts,tsx,html}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## Testing

### Unit Tests (Vitest)

```typescript
// lib/__tests__/storage.test.ts
import { describe, it, expect, vi } from 'vitest';
import { docStorage } from '../storage';

vi.mock('wxt/storage', () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('docStorage', () => {
  it('should get doc state by id', async () => {
    const state = await docStorage.get('doc-123');
    expect(state).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/extension.spec.ts
import { test, expect, chromium } from '@playwright/test';

test('extension loads side panel', async () => {
  const pathToExtension = './dist/chrome-mv3';

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  const page = await context.newPage();
  await page.goto('https://docs.google.com/document/d/test');

  // Test content script injection
  // Test side panel interaction
});
```

---

## Build & Distribution

```json
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

**Environment Variables:**
```bash
# .env.development
USE_MOCK_NATIVE=true

# .env.production
USE_MOCK_NATIVE=false
```

---

## Reference Files

- [WXT Configuration Reference](./references/wxt-config.md) - Complete wxt.config.ts options
- [MV3 Permissions Reference](./references/mv3-permissions.md) - Manifest permissions guide
- [Messaging Patterns](./references/messaging.md) - Cross-context communication

## Assets

- [Template: Side Panel React](./assets/templates/sidepanel/) - Side panel starter
- [Template: Content Script](./assets/templates/content-script/) - Content script starter
