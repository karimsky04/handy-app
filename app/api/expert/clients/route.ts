import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find expert
    const { data: expert, error: expertError } = await supabase
      .from("experts")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (expertError || !expert) {
      return NextResponse.json(
        { error: "Expert profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { full_name, email, phone, countries, asset_types, complexity, tax_years } = body;

    if (!full_name || !email || !countries?.length) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, countries" },
        { status: 400 }
      );
    }

    // Create client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        full_name,
        email,
        phone: phone || null,
        countries,
        asset_types: asset_types || [],
        complexity: complexity || "Moderate",
        tax_years: tax_years || [],
        overall_status: "active",
      })
      .select()
      .single();

    if (clientError) {
      return NextResponse.json(
        { error: clientError.message },
        { status: 500 }
      );
    }

    // Link client to expert
    const { error: ceError } = await supabase.from("client_experts").insert({
      client_id: client.id,
      expert_id: expert.id,
      jurisdiction: countries[0],
      status: "active",
      earnings: 0,
    });

    if (ceError) {
      return NextResponse.json({ error: ceError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      expert_id: expert.id,
      client_id: client.id,
      action: "client_created",
      details: `Created client ${full_name}`,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
