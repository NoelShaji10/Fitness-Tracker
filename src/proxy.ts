import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login", nextUrl));
    }
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
