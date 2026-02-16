import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { table, id, status } = await request.json();

    if (!table || !id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (table !== "leads" && table !== "carf_leads") {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const validStatuses = [
      "new",
      "contacted",
      "in_progress",
      "converted",
      "lost",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await supabase
      .from(table)
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
