import { type NextRequest, NextResponse } from "next/server"

const BASE = process.env.BACKEND_API_BASE_URL

function buildTargetUrl(segments: string[] | undefined, search: string) {
  const base = (BASE || "").replace(/\/+$/, "")
  const path = (segments?.join("/") || "").replace(/^\/+/, "")
  return `${base}/${path}${search || ""}`
}

async function handler(req: NextRequest, { params }: { params: { path?: string[] } }) {
  if (!BASE) {
    return NextResponse.json({ message: "Missing BACKEND_API_BASE_URL server env var" }, { status: 500 })
  }

  const url = buildTargetUrl(params.path, req.nextUrl.search)

  // Forward most headers, but drop hop-by-hop and host-length specifics
  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  }

  const resp = await fetch(url, init)

  // Pass through response body/headers/status
  const outHeaders = new Headers(resp.headers)
  return new NextResponse(resp.body, {
    status: resp.status,
    headers: outHeaders,
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS }
