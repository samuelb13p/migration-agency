const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export function getApiUrl(path = "") {
  return `${API_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { data?: T; message?: string }) : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `API request failed: ${response.status}`);
  }

  return (payload?.data ?? null) as T;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export async function apiFetchWithToken<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}
