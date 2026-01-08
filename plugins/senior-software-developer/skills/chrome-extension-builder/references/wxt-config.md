# WXT Configuration Reference

Complete reference for `wxt.config.ts` options.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Manifest Configuration](#manifest-configuration)
- [Entrypoints](#entrypoints)
- [Modules](#modules)
- [Vite Configuration](#vite-configuration)
- [Browser Targeting](#browser-targeting)

---

## Basic Configuration

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  // Source directory (default: current directory)
  srcDir: 'src',

  // Output directory (default: .output)
  outDir: 'dist',

  // Entry points directory (default: entrypoints)
  entrypointsDir: 'entrypoints',

  // Public assets directory
  publicDir: 'public',

  // TypeScript config
  alias: {
    '@': './src',
    '~': './',
  },

  // Framework modules
  modules: ['@wxt-dev/module-react'],

  // Manifest overrides
  manifest: { /* ... */ },

  // Vite configuration
  vite: () => ({ /* ... */ }),
});
```

---

## Manifest Configuration

Override or extend generated manifest:

```typescript
export default defineConfig({
  manifest: {
    // Required
    name: 'My Extension',
    version: '1.0.0',
    description: 'Extension description',

    // Permissions
    permissions: [
      'storage',        // chrome.storage API
      'activeTab',      // Access current tab on click
      'scripting',      // Inject scripts programmatically
      'sidePanel',      // Side panel API
      'tabs',           // Tab management
      'nativeMessaging',// Native app communication
      'clipboardWrite', // Write to clipboard
      'clipboardRead',  // Read clipboard
      'notifications',  // Show notifications
      'alarms',         // Schedule events
      'contextMenus',   // Right-click menus
      'webRequest',     // Intercept network requests
    ],

    // Host permissions (URL patterns)
    host_permissions: [
      'https://docs.google.com/*',
      'https://www.overleaf.com/*',
      '<all_urls>',     // All websites (use sparingly)
    ],

    // Content Security Policy
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },

    // Action (toolbar icon)
    action: {
      default_title: 'Click me',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },

    // Side panel configuration
    side_panel: {
      default_path: 'sidepanel.html',
    },

    // Commands (keyboard shortcuts)
    commands: {
      '_execute_action': {
        suggested_key: {
          default: 'Ctrl+Shift+Y',
          mac: 'Command+Shift+Y',
        },
      },
      'toggle-feature': {
        suggested_key: { default: 'Ctrl+Shift+F' },
        description: 'Toggle feature',
      },
    },

    // Native messaging hosts
    natively_connectable: {
      ids: ['com.example.nativeapp'],
    },

    // Web accessible resources
    web_accessible_resources: [
      {
        resources: ['images/*', 'fonts/*'],
        matches: ['<all_urls>'],
      },
    ],

    // Minimum Chrome version
    minimum_chrome_version: '120',

    // Icons
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
});
```

---

## Entrypoints

### Background Service Worker

```typescript
// entrypoints/background.ts
export default defineBackground({
  // Module type (enables code splitting)
  type: 'module',

  // Persistent (MV2 only, ignored in MV3)
  persistent: false,

  // Browser targeting
  include: ['chrome', 'firefox'],
  exclude: ['safari'],

  main() {
    // Entry point code
  },
});

// Simplified version
export default defineBackground(() => {
  // Entry point code
});
```

### Content Scripts

```typescript
// entrypoints/content.ts
export default defineContentScript({
  // URL patterns to match
  matches: ['https://example.com/*', '*://*.example.org/*'],

  // Exclude patterns
  excludeMatches: ['https://example.com/admin/*'],

  // Glob patterns
  includeGlobs: ['*://example.com/docs/*'],
  excludeGlobs: ['*://example.com/docs/private/*'],

  // Injection timing
  runAt: 'document_idle', // 'document_start' | 'document_end' | 'document_idle'

  // Frame injection
  allFrames: false, // true to inject in all frames

  // World isolation
  world: 'ISOLATED', // 'ISOLATED' | 'MAIN'

  // Match about:blank
  matchAboutBlank: false,
  matchOriginAsFallback: false,

  // CSS injection mode
  cssInjectionMode: 'manifest', // 'manifest' | 'manual' | 'ui'

  // Registration method
  registration: 'manifest', // 'manifest' | 'runtime'

  // Browser targeting
  include: ['chrome'],
  exclude: ['firefox'],

  main(ctx) {
    // ctx.invalidated - true when script should stop
    // ctx.addEventListener() - auto-cleanup listeners
  },
});
```

### HTML Entrypoints (Popup, Side Panel, Options)

**Side Panel HTML:**
```html
<!-- entrypoints/sidepanel/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Side Panel</title>
  <!-- Meta tags for manifest options -->
  <meta name="manifest.open_at_install" content="false">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**Popup HTML:**
```html
<!-- entrypoints/popup/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Popup</title>
  <!-- Popup specific options -->
  <meta name="manifest.default_icon" content='{"16":"/icon-16.png"}'>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**Options Page HTML:**
```html
<!-- entrypoints/options/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Options</title>
  <meta name="manifest.open_in_tab" content="true">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

---

## Modules

### React Module

```bash
pnpm add -D @wxt-dev/module-react
```

```typescript
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
});
```

### Auto Icons Module

```bash
pnpm add -D @wxt-dev/auto-icons
```

```typescript
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
    sizes: [16, 32, 48, 96, 128],
  },
});
```

### Custom Vite Plugins

```typescript
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react()],
    build: {
      sourcemap: true,
    },
    css: {
      postcss: './postcss.config.js',
    },
  }),
});
```

---

## Browser Targeting

### Development

```bash
# Chrome (default)
pnpm dev

# Firefox
pnpm dev -b firefox

# Safari
pnpm dev -b safari

# Edge
pnpm dev -b edge
```

### Build

```bash
# Chrome MV3
pnpm build

# Firefox MV2/MV3
pnpm build -b firefox

# All browsers
pnpm build -b chrome -b firefox -b edge
```

### Configuration

```typescript
export default defineConfig({
  // Target browser (can be overridden via CLI)
  browser: 'chrome',

  // Manifest version
  manifestVersion: 3, // or 2 for Firefox MV2

  // Browser-specific manifest overrides
  manifest: {
    // Chrome-specific
    $chrome: {
      minimum_chrome_version: '120',
    },
    // Firefox-specific
    $firefox: {
      browser_specific_settings: {
        gecko: {
          id: 'extension@example.com',
          strict_min_version: '109.0',
        },
      },
    },
  },
});
```

---

## Environment Variables

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const mode = import.meta.env.MODE;

// WXT-specific
const browser = import.meta.env.BROWSER; // 'chrome' | 'firefox' | etc.
const manifestVersion = import.meta.env.MANIFEST_VERSION; // 2 | 3
```

**.env files:**
```bash
# .env
VITE_API_URL=https://api.example.com

# .env.development
VITE_DEBUG=true

# .env.production
VITE_DEBUG=false
```

---

## TypeScript Configuration

**tsconfig.json:**
```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./*"]
    }
  }
}
```

Run `wxt prepare` to generate `.wxt/` types after config changes.
