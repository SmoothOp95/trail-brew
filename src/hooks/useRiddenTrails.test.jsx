import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const authState = vi.hoisted(() => ({ user: { uid: 'u1' } }));

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('./useAuth', () => ({ useAuth: () => ({ user: authState.user }) }));
vi.mock('../lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...path) => ({ kind: 'doc', path: path.join('/') })),
  onSnapshot: firestore.onSnapshot,
  updateDoc: firestore.updateDoc,
  arrayUnion: vi.fn((v) => ({ op: 'union', v })),
  arrayRemove: vi.fn((v) => ({ op: 'remove', v })),
}));

import { useRiddenTrails } from './useRiddenTrails';

describe('useRiddenTrails (signed in)', () => {
  let snapshotHandler;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authState.user = { uid: 'u1' };
    snapshotHandler = null;
    firestore.onSnapshot.mockImplementation((_ref, onNext) => {
      snapshotHandler = onNext;
      return vi.fn();
    });
  });

  const deliver = (ids) =>
    act(() => snapshotHandler({ data: () => ({ riddenTrails: ids }) }));

  it('subscribes to the user doc and live-updates when the server changes', async () => {
    const { result } = renderHook(() => useRiddenTrails());
    expect(firestore.onSnapshot).toHaveBeenCalledTimes(1);

    await deliver(['a']);
    expect(result.current.isRidden('a')).toBe(true);

    // A ride logged elsewhere (useRideLog, another device) arrives via snapshot
    await deliver(['a', 'b']);
    expect(result.current.isRidden('b')).toBe(true);
  });

  it('optimistically toggles and persists via arrayUnion/arrayRemove', async () => {
    firestore.updateDoc.mockResolvedValue();
    const { result } = renderHook(() => useRiddenTrails());
    await deliver(['a']);

    act(() => result.current.toggleRidden('b'));
    expect(result.current.isRidden('b')).toBe(true); // optimistic
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/u1' }),
      { riddenTrails: { op: 'union', v: 'b' } }
    );

    act(() => result.current.toggleRidden('a'));
    expect(result.current.isRidden('a')).toBe(false);
    expect(firestore.updateDoc).toHaveBeenLastCalledWith(
      expect.anything(),
      { riddenTrails: { op: 'remove', v: 'a' } }
    );
  });

  it('a failed toggle reverts only that trail, not other in-flight toggles', async () => {
    let rejectFirst;
    firestore.updateDoc
      .mockImplementationOnce(() => new Promise((_, rej) => { rejectFirst = rej; }))
      .mockResolvedValueOnce();

    const { result } = renderHook(() => useRiddenTrails());
    await deliver(['a']);

    act(() => result.current.toggleRidden('b')); // will fail
    act(() => result.current.toggleRidden('c')); // will succeed
    expect(result.current.isRidden('b')).toBe(true);
    expect(result.current.isRidden('c')).toBe(true);

    await act(async () => {
      rejectFirst(new Error('offline'));
      await Promise.resolve();
    });

    expect(result.current.isRidden('b')).toBe(false); // reverted
    expect(result.current.isRidden('c')).toBe(true); // untouched
    expect(result.current.isRidden('a')).toBe(true); // untouched
  });
});

describe('useRiddenTrails (guest)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authState.user = null;
  });

  it('reads and writes localStorage without touching Firestore', () => {
    localStorage.setItem('trailbrew_ridden_trails', JSON.stringify(['x']));
    const { result } = renderHook(() => useRiddenTrails());
    expect(result.current.isRidden('x')).toBe(true);

    act(() => result.current.toggleRidden('y'));
    expect(result.current.isRidden('y')).toBe(true);
    expect(JSON.parse(localStorage.getItem('trailbrew_ridden_trails'))).toEqual(
      expect.arrayContaining(['x', 'y'])
    );
    expect(firestore.updateDoc).not.toHaveBeenCalled();
    expect(firestore.onSnapshot).not.toHaveBeenCalled();
  });
});
