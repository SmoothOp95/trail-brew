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
  collection: vi.fn((_db, ...path) => ({ kind: 'collection', path: path.join('/') })),
  query: vi.fn((ref) => ({ kind: 'query', ref })),
  orderBy: vi.fn(() => ({})),
  addDoc: vi.fn(),
  onSnapshot: firestore.onSnapshot,
  updateDoc: firestore.updateDoc,
  serverTimestamp: vi.fn(() => 'ts'),
}));

import { useBikeData } from './useBikeData';

describe('useBikeData.updateBikeData (signed in)', () => {
  let userDocHandler;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authState.user = { uid: 'u1' };
    userDocHandler = null;
    // The hook opens three snapshots: user doc + two subcollection queries
    firestore.onSnapshot.mockImplementation((ref, onNext) => {
      if (ref.kind === 'doc') userDocHandler = onNext;
      else onNext({ docs: [] });
      return vi.fn();
    });
  });

  const deliverBikeData = (bikeData) =>
    act(() => userDocHandler({ data: () => ({ bikeData }) }));

  const initial = {
    nickname: 'Steed',
    totalDistance: 100,
    totalHours: 10,
    serviceIntervalDistance: 500,
    serviceIntervalHours: 50,
    lastServiceDate: '',
  };

  it('writes only the touched fields using dot-notation paths', async () => {
    firestore.updateDoc.mockResolvedValue();
    const { result } = renderHook(() => useBikeData());
    await deliverBikeData(initial);

    await act(() => result.current.updateBikeData({ nickname: 'New Steed' }));

    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/u1' }),
      { 'bikeData.nickname': 'New Steed' }
    );
    expect(result.current.bikeData.nickname).toBe('New Steed');
    // Untouched fields never leave the client — no stale full-object merge
    const payload = firestore.updateDoc.mock.calls[0][1];
    expect(Object.keys(payload)).toEqual(['bikeData.nickname']);
  });

  it('reverts the optimistic update when the write fails', async () => {
    firestore.updateDoc.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useBikeData());
    await deliverBikeData(initial);

    let ok;
    await act(async () => {
      ok = await result.current.updateBikeData({ nickname: 'Doomed' });
    });

    expect(ok).toBe(false);
    expect(result.current.bikeData.nickname).toBe('Steed'); // rolled back
  });
});

describe('useBikeData.updateBikeData (guest)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    authState.user = null;
  });

  it('merges into localStorage without touching Firestore', async () => {
    const { result } = renderHook(() => useBikeData());

    await act(() => result.current.updateBikeData({ nickname: 'Garage Queen' }));

    expect(result.current.bikeData.nickname).toBe('Garage Queen');
    expect(JSON.parse(localStorage.getItem('bikeTrackerData')).nickname).toBe(
      'Garage Queen'
    );
    expect(firestore.updateDoc).not.toHaveBeenCalled();
  });
});
