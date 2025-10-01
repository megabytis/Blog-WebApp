import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://blog-webapp-alzm.onrender.com"; // your Render backend

export async function GET(req: NextRequest) {
  return proxy(req);
}
export async function POST(req: NextRequest) {
  return proxy(req);
}
export async function PUT(req: NextRequest) {
  return proxy(req);
}
export async function PATCH(req: NextRequest) {
  return proxy(req);
}
export async function DELETE(req: NextRequest) {
  return proxy(req);
}

async function proxy(req: NextRequest) {
  try {
    const urlPath = req.nextUrl.pathname.replace("/api/proxy", ""); // strip proxy prefix
    const url = `${BACKEND_URL}${urlPath}`;

    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("authorization") || "",
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
      credentials: "include",
    });

    const data = await backendRes.text();
    return new NextResponse(data, { status: backendRes.status });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return new NextResponse(JSON.stringify({ message: "Proxy error" }), {
      status: 500,
    });
  }
}
