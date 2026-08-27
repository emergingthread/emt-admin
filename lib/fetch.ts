export async function fetchJson<T>(input: RequestInfo | URL | Response, init?: RequestInit): Promise<T> {
  const parseResponse = async (response: Response): Promise<T> => {
    const rawText = await response.text();
    const payload = rawText ? JSON.parse(rawText) : null;

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        sessionStorage.removeItem("emt-auth-token");
        window.location.assign("/");
      }
      const message = typeof payload?.message === "string"
        ? payload.message
        : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  };

  if (input instanceof Response) {
    return parseResponse(input);
  }

  try {
    const headers = new Headers(init?.headers);
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("emt-auth-token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(input, { ...init, headers });
    return parseResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    throw new Error(message === "Failed to fetch" ? "Failed to fetch" : message);
  }
}
