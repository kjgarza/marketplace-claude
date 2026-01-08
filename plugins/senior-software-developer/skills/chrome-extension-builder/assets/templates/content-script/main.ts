/**
 * Content Script Template
 *
 * This script runs in the context of web pages matching the specified URL patterns.
 * It operates in an isolated world by default, meaning it has access to the DOM
 * but not to the page's JavaScript context.
 */

export default defineContentScript({
  // URL patterns where this script will be injected
  matches: ['https://example.com/*'],

  // Optional: Exclude certain URLs
  // excludeMatches: ['https://example.com/admin/*'],

  // When to inject: 'document_start' | 'document_end' | 'document_idle'
  runAt: 'document_idle',

  // Inject in all frames (iframes) or just the top frame
  allFrames: false,

  // CSS injection mode: 'manifest' | 'manual' | 'ui'
  cssInjectionMode: 'manifest',

  main(ctx) {
    console.log('[Extension] Content script loaded on', window.location.href);

    // Extract page information
    const pageData = extractPageData();

    // Send data to background script
    notifyBackground('PAGE_LOADED', pageData);

    // Listen for messages from background/popup
    setupMessageListener(ctx);

    // Set up DOM observers if needed
    setupMutationObserver(ctx);

    // Clean up when script is invalidated (e.g., extension update)
    ctx.onInvalidated(() => {
      console.log('[Extension] Content script invalidated');
      // Perform cleanup here
    });
  },
});

// ============================================================================
// Page Data Extraction
// ============================================================================

interface PageData {
  url: string;
  title: string;
  text: string;
  selection: string | null;
  metadata: Record<string, string>;
}

function extractPageData(): PageData {
  return {
    url: window.location.href,
    title: document.title,
    text: extractVisibleText(),
    selection: getSelectedText(),
    metadata: extractMetadata(),
  };
}

function extractVisibleText(): string {
  // Get text from the main content area
  // Customize selectors based on the target site
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '#content',
    'body',
  ];

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return cleanText(element.textContent);
    }
  }

  return cleanText(document.body.textContent || '');
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function getSelectedText(): string | null {
  const selection = window.getSelection();
  return selection && selection.toString().trim() ? selection.toString() : null;
}

function extractMetadata(): Record<string, string> {
  const metadata: Record<string, string> = {};

  // Extract common meta tags
  const metaTags = document.querySelectorAll('meta[name], meta[property]');
  metaTags.forEach((tag) => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (name && content) {
      metadata[name] = content;
    }
  });

  return metadata;
}

// ============================================================================
// Communication
// ============================================================================

async function notifyBackground(type: string, data: unknown): Promise<unknown> {
  try {
    return await browser.runtime.sendMessage({ type, data });
  } catch (error) {
    console.error('[Extension] Failed to send message:', error);
    return null;
  }
}

function setupMessageListener(ctx: ContentScriptContext): void {
  const handler = (
    message: { type: string; [key: string]: unknown },
    _sender: browser.Runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    switch (message.type) {
      case 'GET_PAGE_DATA':
        sendResponse(extractPageData());
        break;

      case 'INSERT_TEXT':
        const success = insertText(message.text as string);
        sendResponse({ success });
        break;

      case 'HIGHLIGHT_ELEMENT':
        highlightElement(message.selector as string);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
    return false; // Sync response
  };

  browser.runtime.onMessage.addListener(handler);

  // Clean up listener when invalidated
  ctx.onInvalidated(() => {
    browser.runtime.onMessage.removeListener(handler);
  });
}

// ============================================================================
// DOM Manipulation
// ============================================================================

function insertText(text: string): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);

  // Check if we're in an editable context
  const container = range.commonAncestorContainer;
  const editableParent = findEditableParent(container);

  if (!editableParent) {
    console.warn('[Extension] No editable element found');
    return false;
  }

  // Delete any selected content
  range.deleteContents();

  // Insert new text
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  // Move cursor to end of inserted text
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // Trigger input event for frameworks that listen to it
  editableParent.dispatchEvent(new Event('input', { bubbles: true }));

  return true;
}

function findEditableParent(node: Node): HTMLElement | null {
  let current: Node | null = node;

  while (current && current !== document.body) {
    if (current instanceof HTMLElement) {
      if (
        current.isContentEditable ||
        current.tagName === 'TEXTAREA' ||
        (current.tagName === 'INPUT' && (current as HTMLInputElement).type === 'text')
      ) {
        return current;
      }
    }
    current = current.parentNode;
  }

  return null;
}

function highlightElement(selector: string): void {
  const element = document.querySelector(selector);
  if (!element) return;

  const originalOutline = (element as HTMLElement).style.outline;
  (element as HTMLElement).style.outline = '2px solid #3b82f6';

  setTimeout(() => {
    (element as HTMLElement).style.outline = originalOutline;
  }, 2000);
}

// ============================================================================
// DOM Observation
// ============================================================================

function setupMutationObserver(ctx: ContentScriptContext): void {
  const observer = new MutationObserver((mutations) => {
    // Handle DOM changes
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Process new nodes
        handleNewNodes(mutation.addedNodes);
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Clean up when invalidated
  ctx.onInvalidated(() => {
    observer.disconnect();
  });
}

function handleNewNodes(_nodes: NodeList): void {
  // Process newly added DOM nodes
  // Useful for SPAs that dynamically load content
}
