import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  const targetPath = Array.isArray(slug) ? slug.join("/") : slug;
  const backendURL = `${process.env.BACKEND_API_BASE_URL}/${targetPath}`;

  try {
    const response = await fetch(backendURL, {
      method: req.method,
      headers: {
        ...req.headers,
        host: "", // remove host to prevent issues
      },
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });

    const data = await response.text();
    res.send(data);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Proxy request failed", details: err.message });
  }
}
