import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieEncoding: 'base64url',
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: false,
            })
          );
        },
      },
    }
  );

  // getUser() validates the JWT server-side and refreshes tokens if needed.
  // Refreshed tokens are written to supabaseResponse via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Helper: create a redirect that preserves any refreshed auth cookies
  function redirectTo(newPath: string, params?: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    // Clear existing search params then set new ones
    url.search = "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = NextResponse.redirect(url);
    // Copy refreshed auth cookies to the redirect response so the browser
    // stores the new tokens even when we redirect.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });
    return response;
  }

  // --- Expert routes ---
  if (!user && pathname.startsWith("/expert") && pathname !== "/expert/login") {
    return redirectTo("/expert/login", { redirectTo: pathname });
  }

  if (user && pathname === "/expert/login") {
    return redirectTo("/expert");
  }

  // --- Platform admin routes ---
  if (pathname.startsWith("/platform-admin") && pathname !== "/platform-admin/login") {
    if (!user) {
      return redirectTo("/platform-admin/login", { redirectTo: pathname });
    }

    // Check admin role
    const { data: expertRow } = await supabase
      .from("experts")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!expertRow || expertRow.role !== "admin") {
      return redirectTo("/expert");
    }
  }

  if (user && pathname === "/platform-admin/login") {
    // Check if admin — if yes, redirect to admin dashboard
    const { data: expertRow } = await supabase
      .from("experts")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (expertRow?.role === "admin") {
      return redirectTo("/platform-admin");
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/expert", "/expert/:path*", "/platform-admin", "/platform-admin/:path*"],
};
