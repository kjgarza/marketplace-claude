# MV3 Permissions Reference

Guide to Chrome Extension Manifest V3 permissions.

## Table of Contents

- [Permission Types](#permission-types)
- [Common Permissions](#common-permissions)
- [Host Permissions](#host-permissions)
- [Optional Permissions](#optional-permissions)
- [Permission Warnings](#permission-warnings)

---

## Permission Types

### API Permissions

Declared in `permissions` array. Granted at install time.

```json
{
  "permissions": ["storage", "tabs", "activeTab"]
}
```

### Host Permissions

URL patterns for content script injection and API access.

```json
{
  "host_permissions": [
    "https://docs.google.com/*",
    "https://*.example.com/*"
  ]
}
```

### Optional Permissions

Requested at runtime. Better for user trust.

```json
{
  "optional_permissions": ["downloads", "history"],
  "optional_host_permissions": ["https://api.example.com/*"]
}
```

---

## Common Permissions

### Storage (`storage`)

Access `chrome.storage` API for persistent data.

```typescript
// Local storage (per device)
await chrome.storage.local.set({ key: 'value' });
const { key } = await chrome.storage.local.get('key');

// Sync storage (across devices if signed in)
await chrome.storage.sync.set({ settings: {} });

// Session storage (cleared on browser close)
await chrome.storage.session.set({ temp: 'data' });
```

**Limits:**
- `local`: 10 MB (or unlimited with `unlimitedStorage`)
- `sync`: 100 KB total, 8 KB per item
- `session`: 10 MB

---

### Active Tab (`activeTab`)

Temporary access to current tab when user invokes extension.

```typescript
// Granted when user clicks extension icon
browser.action.onClicked.addListener(async (tab) => {
  // Now have temporary access to tab.url and can inject scripts
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js'],
  });
});
```

**Benefits:** No scary permission warnings. Access granted per-click.

---

### Scripting (`scripting`)

Programmatically inject scripts and CSS.

```typescript
// Inject script
await chrome.scripting.executeScript({
  target: { tabId },
  files: ['inject.js'],
  world: 'MAIN', // or 'ISOLATED'
});

// Inject CSS
await chrome.scripting.insertCSS({
  target: { tabId },
  css: '.highlight { background: yellow; }',
});

// Remove CSS
await chrome.scripting.removeCSS({
  target: { tabId },
  css: '.highlight { background: yellow; }',
});
```

---

### Tabs (`tabs`)

Full tab management and access to tab URLs.

```typescript
// Query tabs
const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

// Create tab
const tab = await chrome.tabs.create({ url: 'https://example.com' });

// Update tab
await chrome.tabs.update(tabId, { url: 'https://new-url.com' });

// Get tab info (requires host_permissions for URL access)
const tab = await chrome.tabs.get(tabId);
console.log(tab.url, tab.title);
```

**Note:** Without `tabs`, you can still query tabs but won't see `url`, `title`, or `favIconUrl`.

---

### Side Panel (`sidePanel`)

Enable side panel UI.

```typescript
// Open side panel
await chrome.sidePanel.open({ windowId });

// Set panel behavior
await chrome.sidePanel.setOptions({
  tabId,
  path: 'sidepanel.html',
  enabled: true,
});

// Set panel for all tabs
await chrome.sidePanel.setPanelBehavior({
  openPanelOnActionClick: true,
});
```

---

### Native Messaging (`nativeMessaging`)

Communicate with native applications.

```typescript
// Connect to native app (declared in native messaging host manifest)
const port = chrome.runtime.connectNative('com.example.myapp');

port.onMessage.addListener((message) => {
  console.log('Received:', message);
});

port.postMessage({ type: 'REQUEST', data: {} });

// One-time message
const response = await chrome.runtime.sendNativeMessage(
  'com.example.myapp',
  { type: 'PING' }
);
```

**Requires native host manifest on user's system.**

---

### Clipboard (`clipboardRead`, `clipboardWrite`)

Access system clipboard.

```typescript
// Write (also needs user gesture)
await navigator.clipboard.writeText('Hello');

// Read (needs clipboardRead permission)
const text = await navigator.clipboard.readText();
```

---

### Notifications (`notifications`)

Show system notifications.

```typescript
chrome.notifications.create('notification-id', {
  type: 'basic',
  iconUrl: 'icon-128.png',
  title: 'Notification Title',
  message: 'Notification body text',
  priority: 2,
});

chrome.notifications.onClicked.addListener((notificationId) => {
  // Handle click
});
```

---

### Alarms (`alarms`)

Schedule periodic or one-time events.

```typescript
// Create alarm
chrome.alarms.create('check-updates', {
  delayInMinutes: 1,
  periodInMinutes: 30,
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-updates') {
    // Run scheduled task
  }
});
```

---

### Context Menus (`contextMenus`)

Add items to right-click menus.

```typescript
chrome.contextMenus.create({
  id: 'lookup-word',
  title: 'Look up "%s"',
  contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lookup-word') {
    const selectedText = info.selectionText;
    // Handle selection
  }
});
```

---

### Web Request (`webRequest`, `webRequestBlocking`)

Intercept and modify network requests.

```typescript
// Observe requests (needs host_permissions)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log('Request to:', details.url);
  },
  { urls: ['<all_urls>'] }
);

// Block/redirect (needs declarativeNetRequest in MV3)
// webRequestBlocking deprecated in MV3 - use declarativeNetRequest instead
```

---

### Declarative Net Request (`declarativeNetRequest`)

MV3 replacement for blocking webRequest.

```typescript
// Define rules in manifest or dynamically
await chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [{
    id: 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: '*://ads.example.com/*',
      resourceTypes: ['script', 'image'],
    },
  }],
  removeRuleIds: [],
});
```

---

## Host Permissions

### URL Pattern Syntax

```
<scheme>://<host><path>

Schemes: http, https, *, file, ftp
Host: *, *.example.com, specific.example.com
Path: /*, /path/*, /specific/path
```

### Examples

```json
{
  "host_permissions": [
    "https://docs.google.com/*",
    "https://*.overleaf.com/*",
    "*://example.com/*",
    "<all_urls>"
  ]
}
```

### Best Practices

1. **Be specific** - Only request needed domains
2. **Use activeTab** when possible - No warning, per-click access
3. **Use optional_host_permissions** - Request at runtime

---

## Optional Permissions

Request permissions at runtime for better user trust.

### Manifest Declaration

```json
{
  "optional_permissions": ["downloads", "history"],
  "optional_host_permissions": ["https://api.example.com/*"]
}
```

### Runtime Request

```typescript
// Check if granted
const granted = await chrome.permissions.contains({
  permissions: ['downloads'],
  origins: ['https://api.example.com/*'],
});

// Request (must be in response to user gesture)
const success = await chrome.permissions.request({
  permissions: ['downloads'],
  origins: ['https://api.example.com/*'],
});

// Remove
await chrome.permissions.remove({
  permissions: ['downloads'],
});
```

---

## Permission Warnings

### Warning Levels

| Warning | Permissions |
|---------|-------------|
| **None** | `activeTab`, `storage`, `alarms`, `contextMenus` |
| **Low** | `notifications` |
| **Medium** | `tabs`, `scripting` |
| **High** | `<all_urls>`, `webRequest`, `history`, `downloads` |

### Reducing Warnings

1. Use `activeTab` instead of broad host permissions
2. Use `optional_permissions` for rarely-used features
3. Be specific with host permissions
4. Explain permissions in extension description

---

## Content Security Policy

Default MV3 CSP is restrictive. Override carefully:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts; script-src 'self' 'unsafe-eval'"
  }
}
```

**MV3 Restrictions:**
- No `'unsafe-eval'` in extension pages
- No remote code execution
- All scripts must be bundled
