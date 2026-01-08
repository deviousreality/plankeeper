import { H3Event } from 'h3';
import { IncomingMessage, ServerResponse } from 'http';

export const createMockH3Event = (options: {
  body?: Record<string, any>;
  requestHeaders?: Record<string, string>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  method?: string;
}): H3Event => {
  const requestHeaders = options.requestHeaders || {};
  const method = options.method || 'POST';

  // Create mock IncomingMessage
  const mockReq = {
    headers: requestHeaders,
    method: method,
    url: '/api/plant_photos',
  } as IncomingMessage;

  // Create mock ServerResponse
  const mockRes = {
    statusCode: 200,
  } as ServerResponse;

  const event = new H3Event(mockReq, mockRes);

  // Add context and custom properties
  event.context = {
    params: options.params || {},
    query: options.query || {},
  };

  // Add mock body for readBody function
  (event as any)._requestBody = options.body;

  return event;
};
