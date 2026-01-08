import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // Health check endpoint
  if (event.path === '/api/health') {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', message: 'Werewolf Game API' }),
    };
  }

  // For WebSocket upgrade attempts
  if (event.headers.upgrade === 'websocket') {
    return {
      statusCode: 426,
      body: JSON.stringify({
        message: 'WebSocket connections not supported on Netlify. Using Supabase Realtime instead.',
      }),
    };
  }

  // Default response
  return {
    statusCode: 404,
    body: JSON.stringify({ message: 'Not found' }),
  };
};
