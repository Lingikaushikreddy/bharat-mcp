import { AuthenticationError, ApiError } from '@bharat-mcp/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RazorpayClient, createRazorpayClient } from '../razorpay-client.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const client = () =>
  new RazorpayClient({ keyId: 'rzp_test_key', keySecret: 'secret', retryBaseDelayMs: 1 });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('RazorpayClient', () => {
  it('defaults to the public API and sends basic auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { id: 'order_1' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client().get('orders/order_1')).resolves.toEqual({ id: 'order_1' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.razorpay.com/v1/orders/order_1');
    const expected = 'Basic ' + Buffer.from('rzp_test_key:secret').toString('base64');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: expected });
  });

  it('retries transient failures and then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { error: 'unavailable' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client().get('payments')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry client errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, { error: 'bad request' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client().post('orders', {})).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps 401 to AuthenticationError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {})));
    await expect(client().get('orders')).rejects.toBeInstanceOf(AuthenticationError);
  });
});

describe('createRazorpayClient', () => {
  it('fails fast when credentials are missing', () => {
    vi.stubEnv('RAZORPAY_KEY_ID', '');
    vi.stubEnv('RAZORPAY_KEY_SECRET', '');
    expect(() => createRazorpayClient()).toThrow(AuthenticationError);
  });
});
