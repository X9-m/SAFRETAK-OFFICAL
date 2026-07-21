export interface RestError {
  message: string;
  status: number;
}

export interface RestResult<T> {
  data: T | null;
  error: RestError | null;
}

export interface SelectOptions {
  select: string;
  filters?: Record<string, string>;
  order?: string;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json() as Record<string, unknown>;
    return [body.message, body.details, body.hint, body.code]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' | ') || `HTTP_${response.status}`;
  } catch {
    return `HTTP_${response.status}`;
  }
};

export const createRestClient = (
  rawUrl: string,
  publishableKey: string,
  fetcher: FetchLike = fetch,
  timeoutMs = 14_500,
) => {
  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
    if (baseUrl.protocol !== 'https:') throw new Error('HTTPS is required.');
  } catch {
    throw new Error('Invalid platform URL configuration.');
  }
  if (!publishableKey.trim()) throw new Error('Missing platform key configuration.');

  const restBaseUrl = new URL('/rest/v1/', baseUrl);

  const request = async <T>(path: string, init: RequestInit): Promise<RestResult<T>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(new URL(path, restBaseUrl), {
        ...init,
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          'Content-Profile': 'public',
          'Accept-Profile': 'public',
          ...init.headers,
        },
      });

      if (!response.ok) {
        return { data: null, error: { message: await parseErrorMessage(response), status: response.status } };
      }
      if (response.status === 204) return { data: null, error: null };
      return { data: await response.json() as T, error: null };
    } catch {
      return { data: null, error: { message: controller.signal.aborted ? 'REQUEST_TIMEOUT' : 'CONNECTION_FAILED', status: 0 } };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return {
    rpc<T = unknown>(functionName: string, parameters: Record<string, unknown>): Promise<RestResult<T>> {
      if (!/^[a-z][a-z0-9_]*$/.test(functionName)) {
        return Promise.resolve({ data: null, error: { message: 'INVALID_RPC_NAME', status: 0 } });
      }
      return request<T>(`rpc/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters),
      });
    },

    select<T = unknown>(table: string, options: SelectOptions): Promise<RestResult<T[]>> {
      if (!/^[a-z][a-z0-9_]*$/.test(table)) {
        return Promise.resolve({ data: null, error: { message: 'INVALID_TABLE_NAME', status: 0 } });
      }
      const query = new URLSearchParams();
      query.set('select', options.select.replace(/\s+/g, ' ').trim());
      for (const [column, expression] of Object.entries(options.filters || {})) {
        if (/^[a-z][a-z0-9_]*$/.test(column)) query.set(column, expression);
      }
      if (options.order) query.set('order', options.order);
      return request<T[]>(`${table}?${query.toString()}`, { method: 'GET' });
    },
  };
};
