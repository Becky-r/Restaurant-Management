import Cookies from "js-cookie"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get("token")
  
  const headers = {
    ...options.headers,
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Optional: handle auto-logout or token refresh logic here
    // For now, middleware handles redirection
  }

  return response
}

export const api = {
  get: (endpoint: string) => authFetch(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) => authFetch(endpoint, { method: "POST", body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any) => authFetch(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => authFetch(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string) => authFetch(endpoint, { method: "DELETE" }),
}
