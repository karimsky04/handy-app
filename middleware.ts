import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Expert routes ---
  if (!user && pathname.startsWith("/expert") && pathname !== "/expert/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/expert/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/expert/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/expert";
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  // --- Platform admin routes ---
  if (pathname.startsWith("/platform-admin") && pathname !== "/platform-admin/login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/platform-admin/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Check admin role
    const { data: expertRow } = await supabase
      .from("experts")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!expertRow || expertRow.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/expert";
      return NextResponse.redirect(url);
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
      const url = request.nextUrl.clone();
      url.pathname = "/platform-admin";
      url.searchParams.delete("redirectTo");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/expert", "/expert/:path*", "/platform-admin", "/platform-admin/:path*"],
};
