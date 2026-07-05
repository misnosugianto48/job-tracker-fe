export const API_BASE = import.meta.env.VITE_API_URL

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new Error('Unable to connect to the server. Please check your connection and try again.')
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body.error) message = body.error
      else if (body.message) message = body.message
    } catch {
      // response body wasn't JSON — use status text
      if (res.statusText) message = res.statusText
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export function friendlyError(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again later.'
}
