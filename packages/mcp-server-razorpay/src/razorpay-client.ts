/**
 * Razorpay API Client
 *
 * Typed HTTP client wrapping Razorpay's REST API with:
 * - Basic Auth (key_id / key_secret)
 * - Exponential backoff retries on transient failures
 * - Timeout handling
 * - Structured error mapping to McpError hierarchy
 */

import {
  ApiError,
  AuthenticationError,
  RateLimitError,
  createLogger,
  type ApiClientConfig,
} from '@bharat-mcp/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RazorpayConfig extends ApiClientConfig {
  keyId: string;
  keySecret: string;
}

export interface RazorpayRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  idempotencyKey?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const logger = createLogger('razorpay-client');

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class RazorpayClient {
  private readonly config: Required<
    Pick<RazorpayConfig, 'baseUrl' | 'timeoutMs' | 'maxRetries' | 'retryBaseDelayMs'>
  > &
    RazorpayConfig;
  private readonly authHeader: string;

  constructor(config: RazorpayConfig) {
    this.config = {
      baseUrl: config.baseUrl ?? RAZORPAY_API_BASE,
      timeoutMs: config.timeoutMs ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 1_000,
      ...config,
    };

    // Razorpay uses HTTP Basic Auth: base64(key_id:key_secret)
    this.authHeader =
      'Basic ' + Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString('base64');
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async request<T>(options: RazorpayRequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: this.authHeader,
      ...this.config.defaultHeaders,
    };

    if (options.idempotencyKey) {
      headers['X-Payout-Idempotency'] = options.idempotencyKey;
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (response.ok) {
          return (await response.json()) as T;
        }

        // Map HTTP errors to our error hierarchy
        const responseBody = await this.safeParseBody(response);

        if (response.status === 401) {
          throw new AuthenticationError('Razorpay authentication failed. Check your API keys.', {
            context: { url, method: options.method },
          });
        }

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
          throw new RateLimitError('Razorpay rate limit exceeded.', { retryAfter });
        }

        const apiError = new ApiError(
          `Razorpay API error: ${response.status} ${response.statusText}`,
          {
            httpStatus: response.status,
            responseBody,
            url,
            method: options.method,
          },
        );

        // Only retry on transient failures
        if (TRANSIENT_STATUS_CODES.has(response.status) && attempt < this.config.maxRetries) {
          lastError = apiError;
          await this.backoff(attempt);
          logger.warn({ attempt, status: response.status, url }, 'Retrying transient failure');
          continue;
        }

        throw apiError;
      } catch (error) {
        if (error instanceof AuthenticationError || error instanceof RateLimitError) {
          throw error;
        }
        if (error instanceof ApiError && !TRANSIENT_STATUS_CODES.has(error.httpStatus)) {
          throw error;
        }

        lastError = error;

        if (attempt < this.config.maxRetries) {
          await this.backoff(attempt);
          logger.warn({ attempt, error: String(error) }, 'Retrying after error');
          continue;
        }
      }
    }

    throw lastError;
  }

  // Convenience methods
  async get<T>(path: string, query?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(
    path: string,
    body: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, idempotencyKey });
  }

  // -------------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------------

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.config.baseUrl + '/');
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async safeParseBody(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return await response.text().catch(() => null);
    }
  }

  private async backoff(attempt: number): Promise<void> {
    const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt);
    const jitter = delay * 0.2 * Math.random();
    await new Promise((resolve) => setTimeout(resolve, delay + jitter));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createRazorpayClient(config?: Partial<RazorpayConfig>): RazorpayClient {
  const keyId = config?.keyId ?? process.env.RAZORPAY_KEY_ID;
  const keySecret = config?.keySecret ?? process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AuthenticationError(
      'Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.',
    );
  }

  return new RazorpayClient({
    keyId,
    keySecret,
    baseUrl: config?.baseUrl,
    timeoutMs: config?.timeoutMs,
    maxRetries: config?.maxRetries,
    retryBaseDelayMs: config?.retryBaseDelayMs,
    defaultHeaders: config?.defaultHeaders,
    sandbox: config?.sandbox,
  });
}
