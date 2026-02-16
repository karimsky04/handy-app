import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/*
  Supabase table: expert_applications

  CREATE TABLE expert_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT NOT NULL,
    professional_title TEXT NOT NULL,
    license_number TEXT NOT NULL,
    years_experience TEXT NOT NULL,
    specializations JSONB DEFAULT '[]',
    cross_border_experience BOOLEAN DEFAULT false,
    annual_clients TEXT,
    languages JSONB DEFAULT '[]',
    website TEXT,
    practice_description TEXT,
    referral_source TEXT,
    status TEXT DEFAULT 'new'
  );
*/

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      fullName,
      email,
      phone,
      country,
      professionalTitle,
      licenseNumber,
      yearsExperience,
      specializations,
      crossBorderExperience,
      annualClients,
      languages,
      website,
      practiceDescription,
      referralSource,
    } = body;

    if (!email || !fullName || !country || !professionalTitle || !licenseNumber || !yearsExperience) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase()
      .from("expert_applications")
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
        country,
        professional_title: professionalTitle,
        license_number: licenseNumber,
        years_experience: yearsExperience,
        specializations: specializations || [],
        cross_border_experience: crossBorderExperience ?? false,
        annual_clients: annualClients || null,
        languages: languages || [],
        website: website || null,
        practice_description: practiceDescription || null,
        referral_source: referralSource || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
