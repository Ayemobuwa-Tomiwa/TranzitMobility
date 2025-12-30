import { Clerk } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.auth !== false) {
    const token = await Clerk.session?.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}
