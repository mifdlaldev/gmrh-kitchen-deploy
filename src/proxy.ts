import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getUserRole } from "@/lib/supabase/profile";

const authRoutes = ["/login", "/register"];
const userRoutes = ["/orders"];

function isAuthRoute(pathname: string) {
  return authRoutes.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin");
}

function isUserRoute(pathname: string) {
  return userRoutes.some((route) => pathname.startsWith(route));
}

function buildRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuthCheck =
    isAuthRoute(pathname) || isAdminRoute(pathname) || isUserRoute(pathname);

  let response = NextResponse.next({
    request,
  });

  if (!requiresAuthCheck) {
    return response;
  }

  const env = getSupabaseEnv();

  if (!env) {
    return response;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthRoute(pathname) && user) {
    const role = await getUserRole(supabase, user.id);

    return buildRedirect(
      request,
      role === "admin" ? "/admin/dashboard" : "/"
    );
  }

  if (!isAdminRoute(pathname)) {
    if (isUserRoute(pathname) && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = await getUserRole(supabase, user.id);

  if (role !== "admin") {
    return buildRedirect(request, "/");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
