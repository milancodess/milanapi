// middleware.js
export function middleware(request) {
  const url = new URL(request.url);

  if (
    request.headers.get("host") === "www.bhandarimilan.info.np" &&
    url.pathname.startsWith("/api")
  ) {
    url.hostname = "www.api.bhandarimilan.info.np";
    return Response.redirect(url.toString(), 301);
  }

  return new Response(null, { status: 204 });
}
