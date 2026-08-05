import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...path) => ({ kind: 'collection', path: path.join('/') })),
  onSnapshot: firestore.onSnapshot,
}));

import { useTrails } from './useTrails';
import { trails as bundledTrails } from '../data/trails';

const asDocs = (items) => ({
  empty: items.length === 0,
  docs: items.map(({ id, ...data }) => ({ id, data: () => data })),
});

describe('useTrails', () => {
  let snapshotHandler;
  let errorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    firestore.onSnapshot.mockImplementation((_ref, onNext, onError) => {
      snapshotHandler = onNext;
      errorHandler = onError;
      return vi.fn();
    });
  });

  it('serves the bundled catalogue while loading and when /trails is empty', () => {
    const { result } = renderHook(() => useTrails());
    expect(result.current.trails).toBe(bundledTrails);
    expect(result.current.loading).toBe(true);

    act(() => snapshotHandler(asDocs([])));
    expect(result.current.trails).toBe(bundledTrails);
    expect(result.current.source).toBe('bundled');
    expect(result.current.loading).toBe(false);
  });

  it('serves Firestore trails sorted by name once the collection is populated', () => {
    const { result } = renderHook(() => useTrails());
    act(() =>
      snapshotHandler(
        asDocs([
          { id: 'z', name: 'Zwartkops' },
          { id: 'a', name: 'Asidlale' },
        ])
      )
    );
    expect(result.current.source).toBe('firestore');
    expect(result.current.trails.map((t) => t.id)).toEqual(['a', 'z']);
  });

  it('hides archived trails from the catalogue', () => {
    const { result } = renderHook(() => useTrails());
    act(() =>
      snapshotHandler(
        asDocs([
          { id: 'open', name: 'Open Trail' },
          { id: 'closed', name: 'Closed Trail', archived: true },
        ])
      )
    );
    expect(result.current.trails.map((t) => t.id)).toEqual(['open']);
  });

  it('falls back to the bundled catalogue on snapshot error', () => {
    const { result } = renderHook(() => useTrails());
    act(() => errorHandler(new Error('permission-denied')));
    expect(result.current.trails).toBe(bundledTrails);
    expect(result.current.source).toBe('bundled');
    expect(result.current.loading).toBe(false);
  });
});
