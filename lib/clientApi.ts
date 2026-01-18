export type ApiResult<T = any> = {
  ok: boolean
  status: number
  data: T
}

export async function jsonFetch<T = any>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  const text = await res.text()

  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text as any
  }

  return { ok: res.ok, status: res.status, data }
}
