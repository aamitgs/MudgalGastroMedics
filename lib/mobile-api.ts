import "server-only";
import { timingSafeEqual } from "node:crypto";

export const mobileApiVersion = "v1";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getMobileToken() {
  return process.env.MOBILE_API_TOKEN || (isProduction() ? "" : "mgm-mobile");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function tokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  return bearer || request.headers.get("x-mobile-token") || "";
}

export function hasMobileToken(request: Request) {
  const token = tokenFromRequest(request);
  const expected = getMobileToken();
  return Boolean(token && expected) && safeCompare(token, expected);
}

export function mobileUnauthorized() {
  return Response.json(
    {
      ok: false,
      error: "Valid mobile API token required.",
      version: mobileApiVersion
    },
    { status: 401 }
  );
}

export function mobileOk<T extends Record<string, unknown>>(payload: T) {
  return Response.json({
    ok: true,
    version: mobileApiVersion,
    ...payload
  });
}
