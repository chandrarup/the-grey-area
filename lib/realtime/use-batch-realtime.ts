"use client";


/**
 * Compatibility hook while batch boards use their authenticated polling loop.
 */
export function useBatchRealtime(
  sessionIds: string[],
  onChange: () => void,
) {

  // Batch board refreshes through the staff-only server endpoint.
  void sessionIds;
  void onChange;
}
