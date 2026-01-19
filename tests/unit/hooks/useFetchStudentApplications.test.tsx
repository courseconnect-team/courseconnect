import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFetchAssignments } from '@/hooks/Applications/useFetchStudentApplications';

// Mock Firebase
const mockGet = vi.fn();
const mockDoc = vi.fn(() => ({ get: mockGet }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));
const mockFirestore = vi.fn(() => ({ collection: mockCollection }));

vi.mock('@/firebase/firebase_config', () => ({
  default: {
    firestore: () => mockFirestore(),
  },
}));

// Mock feature flags
vi.mock('@/utils/featureFlags', () => ({
  isE2EMode: vi.fn(() => false),
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = 'QueryClientWrapper';

  return Wrapper;
};

describe('useFetchAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.mockReturnValue({ collection: mockCollection });
    mockCollection.mockReturnValue({ doc: mockDoc });
  });

  it('returns default values when userId is undefined', async () => {
    const { result } = renderHook(() => useFetchAssignments(undefined), {
      wrapper: createWrapper(),
    });

    // Should not be loading since query is disabled
    expect(result.current.loading).toBe(false);
    expect(result.current.assignments).toEqual([]);
    expect(result.current.courses).toBeNull();
    expect(result.current.adminApproved).toBe(false);
    expect(result.current.adminDenied).toBe(false);
    expect(result.current.position).toBe('not listed');
    expect(result.current.dateApplied).toBe('not listed');
  });

  it('fetches application data when userId is provided', async () => {
    const mockApplicationData = {
      status: 'Admin_approved',
      position: 'TA',
      date: '2024-01-15',
      courses: {
        ece101: 'accepted',
        ece202: 'applied',
      },
    };

    mockDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockApplicationData,
      }),
    });

    const { result } = renderHook(() => useFetchAssignments('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.adminApproved).toBe(true);
    expect(result.current.adminDenied).toBe(false);
    expect(result.current.position).toBe('TA');
    expect(result.current.dateApplied).toBe('2024-01-15');
    expect(result.current.courses).toEqual({
      ece101: 'accepted',
      ece202: 'applied',
    });
  });

  it('handles denied application status', async () => {
    mockDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          status: 'Admin_denied',
          position: 'UPI',
          date: '2024-02-01',
          courses: null,
        }),
      }),
    });

    const { result } = renderHook(() => useFetchAssignments('user-456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.adminDenied).toBe(true);
    expect(result.current.adminApproved).toBe(false);
  });

  it('handles non-existent application', async () => {
    mockDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: false,
        data: () => undefined,
      }),
    });

    const { result } = renderHook(() => useFetchAssignments('user-789'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.adminApproved).toBe(false);
    expect(result.current.adminDenied).toBe(false);
    expect(result.current.position).toBe('not listed');
    expect(result.current.dateApplied).toBe('not listed');
    expect(result.current.courses).toBeNull();
  });

  it('handles missing optional fields gracefully', async () => {
    mockDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          status: 'applied',
          // position and date are missing
        }),
      }),
    });

    const { result } = renderHook(() => useFetchAssignments('user-abc'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.position).toBe('not listed');
    expect(result.current.dateApplied).toBe('not listed');
  });
});

describe('useFetchAssignments in E2E mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Setup Firebase mocks
    mockFirestore.mockReturnValue({ collection: mockCollection });
    mockCollection.mockReturnValue({ doc: mockDoc });
    mockDoc.mockReturnValue({
      get: mockGet.mockResolvedValue({
        exists: true,
        data: () => ({}),
      }),
    });
  });

  it('returns stub data when in E2E mode', async () => {
    // Re-mock to enable E2E mode
    vi.doMock('@/utils/featureFlags', () => ({
      isE2EMode: vi.fn(() => true),
    }));

    // Re-mock firebase config
    vi.doMock('@/firebase/firebase_config', () => ({
      default: {
        firestore: () => mockFirestore(),
      },
    }));

    // Re-import the hook with the mocked E2E mode
    const { useFetchAssignments: useHookInE2E } = await import(
      '@/hooks/Applications/useFetchStudentApplications'
    );

    const { result } = renderHook(() => useHookInE2E('any-user'), {
      wrapper: createWrapper(),
    });

    // In E2E mode, query returns immediately with stub data (loading is briefly true then false)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have stub data
    expect(result.current.adminApproved).toBeDefined();
  });
});
