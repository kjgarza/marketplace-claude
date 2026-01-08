import { defineConfig } from 'wxt';

export default defineConfig({
  // React integration
  modules: ['@wxt-dev/module-react'],

  // Source directory structure
  srcDir: '.',
  entrypointsDir: 'entrypoints',
  publicDir: 'public',

  // Output directory
  outDir: 'dist',

  // TypeScript path aliases
  alias: {
    '@': './src',
    '~': './',
  },

  // Manifest configuration
  manifest: {
    name: 'My Extension',
    version: '0.1.0',
    description: 'A Chrome extension built with WXT',

    // Permissions
    permissions: [
      'storage',      // Required for wxt/storage
      'activeTab',    // Access current tab on user action
      'scripting',    // Inject scripts programmatically
      'sidePanel',    // Side panel API
      // 'tabs',      // Full tab management
      // 'nativeMessaging', // Native app communication
      // 'clipboardWrite',  // Write to clipboard
      // 'notifications',   // Show notifications
      // 'alarms',          // Schedule events
      // 'contextMenus',    // Right-click menus
    ],

    // URL patterns for content script injection and API access
    host_permissions: [
      // Add your target domains here
      // 'https://docs.google.com/*',
      // 'https://www.overleaf.com/*',
      // '<all_urls>', // All websites (avoid if possible)
    ],

    // Toolbar action configuration
    action: {
      default_title: 'Click to open',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },

    // Icons for Chrome Web Store and extension management
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },

    // Keyboard shortcuts
    commands: {
      '_execute_action': {
        suggested_key: {
          default: 'Ctrl+Shift+E',
          mac: 'Command+Shift+E',
        },
      },
    },

    // Minimum Chrome version
    minimum_chrome_version: '120',

    // Browser-specific overrides
    $chrome: {
      // Chrome-specific settings
    },
    $firefox: {
      browser_specific_settings: {
        gecko: {
          id: 'extension@example.com',
          strict_min_version: '109.0',
        },
      },
    },
  },

  // Vite configuration
  vite: () => ({
    build: {
      // Enable source maps in development
      sourcemap: process.env.NODE_ENV === 'development',
    },
    css: {
      postcss: './postcss.config.js',
    },
  }),
});
