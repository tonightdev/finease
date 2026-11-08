import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15-second timeout prevents indefinite hanging
});

let activeRequests = 0;

function updateLoadingState(delta: number) {
  activeRequests += delta;
  if (typeof window !== "undefined") {
    const event = new CustomEvent("api-loading", {
      detail: activeRequests > 0,
    });
    window.dispatchEvent(event);
  }
}

export function parseJwtPayload(
  token: string,
): { exp?: number; iat?: number; [key: string]: unknown } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenOlderThanDays(token: string, days: number = 7): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.iat !== "number") return false;
  const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
  const thresholdSeconds = days * 24 * 60 * 60;
  return ageSeconds > thresholdSeconds;
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthToken(
  currentToken?: string,
): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const token =
    currentToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("finease_token")
      : null);
  if (!token) return null;

  refreshPromise = (async () => {
    try {
      const res = await axios.post<{
        token: string;
        user?: { id?: string; uid?: string };
      }>(
        `${API_BASE_URL}/auth/refresh`,
        { token },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const newToken = res.data?.token;
      if (newToken && typeof window !== "undefined") {
        localStorage.setItem("finease_token", newToken);
        try {
          const payload = parseJwtPayload(newToken);
          const uid =
            (payload?.uid as string | undefined) ||
            res.data?.user?.id ||
            res.data?.user?.uid;
          if (uid) {
            const tokenMap = JSON.parse(
              localStorage.getItem("finease_token_map") || "{}",
            );
            tokenMap[uid] = newToken;
            localStorage.setItem("finease_token_map", JSON.stringify(tokenMap));
          }
        } catch (e) {
          console.warn("Could not update token map during refresh", e);
        }

        // Notify client components (e.g. SessionList / Identity Nodes) that the token was refreshed
        window.dispatchEvent(
          new CustomEvent("finease-token-refreshed", {
            detail: { oldToken: token, newToken },
          }),
        );

        return newToken;
      }
      return null;
    } catch (err: unknown) {
      const status =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status;

      // 401 means the session was revoked — force logout immediately
      if (status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("finease_token");
          localStorage.removeItem("finease_token_map");
          window.dispatchEvent(new CustomEvent("finease-auth-failure"));
        }
      } else {
        console.warn("Failed to refresh token:", err);
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    updateLoadingState(1);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("finease_token")
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // If token is older than 7 days, trigger background refresh so future requests have fresh token
      if (isTokenOlderThanDays(token, 7)) {
        void refreshAuthToken(token);
      }
    }
    return config;
  },
  (error) => {
    updateLoadingState(-1);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    updateLoadingState(-1);
    return response;
  },
  async (error) => {
    updateLoadingState(-1);
    const originalRequest = error.config;

    // Handle transient network errors / cold-start timeouts (502, 503, 504, ECONNABORTED) on idempotent GET requests
    const isIdempotent = originalRequest?.method?.toLowerCase() === "get";
    const status = error.response?.status;
    const isTransientError =
      !status ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error.code === "ECONNABORTED" ||
      error.message?.includes("Network Error");

    if (
      isIdempotent &&
      isTransientError &&
      originalRequest &&
      (originalRequest._networkRetryCount || 0) < 2
    ) {
      originalRequest._networkRetryCount =
        (originalRequest._networkRetryCount || 0) + 1;
      const delayMs = originalRequest._networkRetryCount * 500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api(originalRequest);
    }

    // Don't retry if the failed request was already /auth/refresh or has already been retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      const newToken = await refreshAuthToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("finease_token");
          window.dispatchEvent(new CustomEvent("finease-auth-failure"));
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
