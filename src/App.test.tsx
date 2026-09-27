import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from '@/App';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

beforeEach(() => {
  // Node 25 ships its own localStorage stub that shadows jsdom's.
  vi.stubGlobal('localStorage', createMemoryStorage());
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ headers: {}, results: [] }))),
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App smoke', () => {
  it('renders the landing page for a guest without hitting the real API', async () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    expect(await screen.findByText('Подборки по настроению')).toBeTruthy();
  });
});
