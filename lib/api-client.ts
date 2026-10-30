export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

export type ApiResponse<T> = T & { data: T; ok: boolean };

/**
 * Robust fetch client with automatic token refreshing and typed errors.
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {};
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers: mergedHeaders,
  };

  let res: Response;
  try {
    res = await fetch(endpoint, config);
  } catch (err: any) {
    throw new ApiError(0, 'NETWORK_ERROR', err?.message || 'Network error occurred');
  }

  // Handle 401 Unauthorized with token refresh (once)
  const isAuthEndpoint =
    endpoint.includes('/api/auth/login') ||
    endpoint.includes('/api/auth/register') ||
    endpoint.includes('/api/auth/refresh') ||
    endpoint.includes('/api/auth/verify-otp') ||
    endpoint.includes('/api/auth/me') ||
    endpoint.includes('/api/auth/forgot-password') ||
    endpoint.includes('/api/auth/reset-password');

  if (res.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          onRefreshed(true);
        } else {
          isRefreshing = false;
          onRefreshed(false);

          // Only redirect if currently on a protected route
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const isProtected =
              path.startsWith('/dashboard') ||
              path.startsWith('/account') ||
              path.startsWith('/admin') ||
              (path.startsWith('/cv/') && !path.startsWith('/cv/public/'));

            if (isProtected) {
              window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
            }
          }
          throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
        }
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(false);
        throw refreshErr;
      }
    } else {
      // Queue concurrent requests while refreshing
      const retrySuccess = await new Promise<boolean>((resolve) => {
        subscribeTokenRefresh(resolve);
      });

      if (!retrySuccess) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
      }
    }

    // Retry original request after successful token refresh
    try {
      res = await fetch(endpoint, config);
    } catch (retryErr: any) {
      throw new ApiError(0, 'NETWORK_ERROR', retryErr?.message || 'Network error on retry');
    }
  }

  // Check if response is raw blob or text (e.g. file exports or preview HTML)
  const contentType = res.headers.get('content-type') || '';
  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
    contentType.includes('image/')
  ) {
    if (!res.ok) {
      throw new ApiError(res.status, 'EXPORT_FAILED', 'Failed to generate file');
    }
    const blob = await res.blob();
    return blob as unknown as ApiResponse<T>;
  }

  if (contentType.includes('text/html')) {
    const htmlText = await res.text();
    return htmlText as unknown as ApiResponse<T>;
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(res.status, 'HTTP_ERROR', res.statusText);
    }
    return {} as unknown as ApiResponse<T>;
  }

  if (!res.ok) {
    const errObj = json?.error || {};
    throw new ApiError(
      res.status,
      errObj.code || 'UNKNOWN_ERROR',
      errObj.message || 'An unexpected error occurred',
      errObj
    );
  }

  // Return data payload if API follows { ok: true, data: ... }
  // To support both direct properties (`res.cv`) and nested (`res.data.cv`):
  if (json && typeof json === 'object' && 'ok' in json && 'data' in json) {
    if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
      return {
        ...json.data,
        data: json.data,
        ok: true,
      } as unknown as ApiResponse<T>;
    }
    return json.data as unknown as ApiResponse<T>;
  }

  return json as unknown as ApiResponse<T>;
}

// Attach helper methods directly to apiClient
apiClient.get = <T = any>(url: string, headers?: Record<string, string>) =>
  apiClient<T>(url, { method: 'GET', headers });

apiClient.post = <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
  apiClient<T>(url, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers,
  });

apiClient.patch = <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
  apiClient<T>(url, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers,
  });

apiClient.delete = <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
  apiClient<T>(url, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
    headers,
  });

apiClient.downloadBlob = async (url: string, method = 'POST', body?: any): Promise<Blob> => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    let msg = 'Failed to download file';
    try {
      const errJson = await res.json();
      msg = errJson.error?.message || errJson.message || msg;
    } catch {}
    throw new ApiError(res.status, 'DOWNLOAD_FAILED', msg);
  }
  return res.blob();
};

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 500);
}

export const api = apiClient;
export default apiClient;
