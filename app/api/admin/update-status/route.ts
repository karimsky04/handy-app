import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { table, id, status } = await request.json();

    if (!table || !id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (table !== "leads" && table !== "carf_leads" && table !== "expert_applications") {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const expertStatuses = ["new", "under_review", "interview_scheduled", "approved", "rejected"];
    const leadStatuses = ["new", "contacted", "in_progress", "converted", "lost"];
    const validStatuses = table === "expert_applications" ? expertStatuses : leadStatuses;

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await getSupabase()
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
