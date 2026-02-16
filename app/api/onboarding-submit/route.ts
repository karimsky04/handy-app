import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      email,
      fullName,
      phone,
      currentCountry,
      previousCountries,
      assetTypes,
      exchangeCount,
      usedDefi,
      taxYears,
      filedCryptoBefore,
      accountantStatus,
      complexityScore,
      estimatedPriceRange,
    } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email and full name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase()
      .from("leads")
      .insert({
        email,
        full_name: fullName,
        phone: phone || null,
        current_country: currentCountry,
        previous_countries: previousCountries,
        asset_types: assetTypes,
        crypto_exchanges_count: exchangeCount || null,
        has_defi: usedDefi,
        tax_years: taxYears,
        filed_before: filedCryptoBefore,
        accountant_status: accountantStatus,
        complexity_score: complexityScore,
        estimated_price_range: estimatedPriceRange,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save lead" },
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
