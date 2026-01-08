import { useState, useEffect, useCallback } from 'react';

interface DataItem {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: number;
}

type MessageType =
  | { type: 'NEW_ITEM'; item: DataItem }
  | { type: 'ITEMS_LOADED'; items: DataItem[] }
  | { type: 'ERROR'; message: string };

export default function App() {
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for messages from background
  useEffect(() => {
    const handleMessage = (message: MessageType) => {
      switch (message.type) {
        case 'NEW_ITEM':
          setItems((prev) => [message.item, ...prev]);
          break;
        case 'ITEMS_LOADED':
          setItems(message.items);
          setLoading(false);
          break;
        case 'ERROR':
          setError(message.message);
          setLoading(false);
          break;
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Load persisted items on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await browser.runtime.sendMessage({ type: 'GET_ITEMS' });
        if (response?.items) {
          setItems(response.items);
        }
      } catch (err) {
        console.error('Failed to load items:', err);
      }
    };
    loadItems();
  }, []);

  const handleRunAction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await browser.runtime.sendMessage({ type: 'RUN_ACTION' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setLoading(false);
    }
  }, []);

  const handleDismiss = useCallback(async (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    await browser.runtime.sendMessage({ type: 'DISMISS_ITEM', itemId });
  }, []);

  const handleItemAction = useCallback(async (itemId: string, action: string) => {
    await browser.runtime.sendMessage({ type: 'ITEM_ACTION', itemId, action });
  }, []);

  return (
    <div className="p-4 min-h-screen bg-background">
      <header className="mb-4">
        <h1 className="text-lg font-semibold">Extension Panel</h1>
        <button
          onClick={handleRunAction}
          disabled={loading}
          className="mt-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Run Action'}
        </button>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          <span className="ml-2 text-muted-foreground">Analyzing...</span>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onDismiss={() => handleDismiss(item.id)}
            onAction={(action) => handleItemAction(item.id, action)}
          />
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items yet. Click "Run Action" to start.
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: DataItem;
  onDismiss: () => void;
  onAction: (action: string) => void;
}

function ItemCard({ item, onDismiss, onAction }: ItemCardProps) {
  return (
    <div className="p-3 bg-card border rounded-lg shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="inline-block px-2 py-0.5 text-xs bg-secondary rounded-full mb-1">
            {item.category}
          </span>
          <h3 className="font-medium text-sm">{item.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-muted rounded"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onAction('apply')}
          className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Apply
        </button>
        <button
          onClick={() => onAction('copy')}
          className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
