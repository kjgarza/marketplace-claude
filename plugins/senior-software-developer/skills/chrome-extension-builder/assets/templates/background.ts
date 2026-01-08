/**
 * Background Service Worker Template
 *
 * This is the central hub for your extension. It handles:
 * - Cross-context messaging
 * - Storage management
 * - Native app communication
 * - Extension lifecycle events
 */

import { storage } from 'wxt/storage';

// ============================================================================
// Types
// ============================================================================

interface StoredState {
  items: DataItem[];
  dismissedIds: string[];
  lastUpdated: number;
}

interface DataItem {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: number;
}

type IncomingMessage =
  | { type: 'GET_ITEMS' }
  | { type: 'RUN_ACTION' }
  | { type: 'DISMISS_ITEM'; itemId: string }
  | { type: 'ITEM_ACTION'; itemId: string; action: string }
  | { type: 'PAGE_LOADED'; data: unknown };

// ============================================================================
// Background Entry Point
// ============================================================================

export default defineBackground(() => {
  console.log('[Background] Service worker started');

  // Set up message listener
  browser.runtime.onMessage.addListener(handleMessage);

  // Set up extension install/update handler
  browser.runtime.onInstalled.addListener(handleInstalled);

  // Set up action click handler (toolbar icon)
  browser.action.onClicked.addListener(handleActionClick);

  // Set up alarm for periodic tasks
  setupAlarms();

  // Set up side panel behavior
  setupSidePanel();
});

// ============================================================================
// Message Handling
// ============================================================================

function handleMessage(
  message: IncomingMessage,
  sender: browser.Runtime.MessageSender,
  sendResponse: (response: unknown) => void
): boolean {
  console.log('[Background] Received message:', message.type, 'from:', sender.tab?.id);

  switch (message.type) {
    case 'GET_ITEMS':
      handleGetItems(sender.tab?.id).then(sendResponse);
      return true; // Async response

    case 'RUN_ACTION':
      handleRunAction(sender.tab?.id).then(sendResponse);
      return true;

    case 'DISMISS_ITEM':
      handleDismissItem(message.itemId, sender.tab?.id).then(sendResponse);
      return true;

    case 'ITEM_ACTION':
      handleItemAction(message.itemId, message.action, sender.tab?.id).then(sendResponse);
      return true;

    case 'PAGE_LOADED':
      handlePageLoaded(message.data, sender.tab).then(sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
}

async function handleGetItems(tabId?: number): Promise<{ items: DataItem[] }> {
  const state = await getStoredState(tabId);
  return { items: state.items };
}

async function handleRunAction(tabId?: number): Promise<{ success: boolean }> {
  try {
    // Get page data from content script
    if (!tabId) throw new Error('No tab ID');

    const pageData = await browser.tabs.sendMessage(tabId, { type: 'GET_PAGE_DATA' });

    // Process the page data (this is where you'd call your API/native app)
    const results = await processPageData(pageData);

    // Store results
    const state = await getStoredState(tabId);
    state.items = [...results, ...state.items];
    state.lastUpdated = Date.now();
    await setStoredState(tabId, state);

    // Notify side panel
    await browser.runtime.sendMessage({
      type: 'ITEMS_LOADED',
      items: state.items.filter((item) => !state.dismissedIds.includes(item.id)),
    });

    return { success: true };
  } catch (error) {
    console.error('[Background] Action failed:', error);

    await browser.runtime.sendMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : 'Action failed',
    });

    return { success: false };
  }
}

async function handleDismissItem(itemId: string, tabId?: number): Promise<{ success: boolean }> {
  const state = await getStoredState(tabId);
  state.dismissedIds.push(itemId);
  await setStoredState(tabId, state);
  return { success: true };
}

async function handleItemAction(
  itemId: string,
  action: string,
  tabId?: number
): Promise<{ success: boolean }> {
  const state = await getStoredState(tabId);
  const item = state.items.find((i) => i.id === itemId);

  if (!item) {
    return { success: false };
  }

  switch (action) {
    case 'apply':
      // Send text to content script to insert
      if (tabId) {
        await browser.tabs.sendMessage(tabId, {
          type: 'INSERT_TEXT',
          text: item.content,
        });
      }
      break;

    case 'copy':
      // Copy to clipboard (need to do this in a context with DOM access)
      // For service workers, send to offscreen document or content script
      break;

    default:
      console.warn('[Background] Unknown action:', action);
  }

  return { success: true };
}

async function handlePageLoaded(
  data: unknown,
  tab?: browser.Tabs.Tab
): Promise<{ received: boolean }> {
  console.log('[Background] Page loaded:', tab?.url, data);
  return { received: true };
}

// ============================================================================
// Data Processing
// ============================================================================

async function processPageData(pageData: unknown): Promise<DataItem[]> {
  // This is where you would:
  // 1. Send data to a native app via native messaging
  // 2. Call an external API
  // 3. Process locally

  // Mock implementation - replace with actual logic
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: crypto.randomUUID(),
      title: 'Sample Result',
      content: 'This is a sample result from processing the page.',
      category: 'General',
      timestamp: Date.now(),
    },
  ];
}

// ============================================================================
// Storage
// ============================================================================

function getStorageKey(tabId?: number): `local:state:${string}` {
  return `local:state:${tabId || 'default'}`;
}

async function getStoredState(tabId?: number): Promise<StoredState> {
  const key = getStorageKey(tabId);
  const state = await storage.getItem<StoredState>(key);
  return state || { items: [], dismissedIds: [], lastUpdated: 0 };
}

async function setStoredState(tabId: number | undefined, state: StoredState): Promise<void> {
  const key = getStorageKey(tabId);
  await storage.setItem(key, state);
}

// ============================================================================
// Extension Lifecycle
// ============================================================================

function handleInstalled(details: browser.Runtime.OnInstalledDetailsType): void {
  console.log('[Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First install - show onboarding or set defaults
    storage.setItem('local:settings', {
      enabled: true,
      autoRun: false,
    });
  } else if (details.reason === 'update') {
    // Extension updated - migrate data if needed
    console.log('[Background] Updated from version:', details.previousVersion);
  }
}

async function handleActionClick(tab: browser.Tabs.Tab): Promise<void> {
  console.log('[Background] Action clicked on tab:', tab.id);

  // Option 1: Open side panel
  if (tab.windowId) {
    await browser.sidePanel.open({ windowId: tab.windowId });
  }

  // Option 2: Toggle popup (if using popup instead of side panel)
  // browser.action.openPopup();

  // Option 3: Inject content script and run action
  // if (tab.id) {
  //   await browser.scripting.executeScript({
  //     target: { tabId: tab.id },
  //     files: ['content-scripts/main.js'],
  //   });
  // }
}

// ============================================================================
// Alarms (Periodic Tasks)
// ============================================================================

function setupAlarms(): void {
  // Create periodic alarm
  browser.alarms.create('periodic-check', {
    periodInMinutes: 30,
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodic-check') {
      console.log('[Background] Running periodic check');
      // Perform periodic task
    }
  });
}

// ============================================================================
// Side Panel Configuration
// ============================================================================

async function setupSidePanel(): Promise<void> {
  // Open side panel when action is clicked
  await browser.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true,
  });
}
