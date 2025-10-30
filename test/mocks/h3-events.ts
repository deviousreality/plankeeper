import type { H3Event } from 'h3';

export const createMockH3Event = (
  partialEvent: Partial<H3Event> & {
    body?: Record<string, any>;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    query?: Record<string, any>;
  }
): H3Event => {
  const defaultHeaders = { 'content-type': 'application/json' };
  const mergedHeaders = { ...defaultHeaders, ...(partialEvent.headers || {}) };

  const event = {
    node: {
      req: {
        headers: mergedHeaders,
        method: 'POST',
      },
    },
    context: {
      params: partialEvent.params || {},
      query: partialEvent.query || {},
    },
    // Our mock readBody function will look for this property
    _requestBody: partialEvent.body,
  } as unknown as H3Event;

  // Deeply merge the partial event to allow for overrides
  return { ...event, ...partialEvent } as H3Event;
};
