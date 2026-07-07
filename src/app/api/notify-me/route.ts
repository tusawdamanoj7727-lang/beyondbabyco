import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      productCategory?: string;
      productId?: string;
      productName?: string;
      mode?: "launch" | "restock";
      source?: string;
    };

    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const productCategory = String(body.productCategory ?? "").trim() || null;
    const productId = body.productId?.trim() || null;
    const productName = body.productName?.trim() || null;
    const isRestock = body.mode === "restock";
    const source = body.source?.trim() || "website";
    const displayName = productName ?? productCategory;

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!productCategory && !productId) {
      return NextResponse.json(
        { success: false, message: "Product category or product ID is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("waitlist").insert({
      email,
      product_category: productCategory,
      product_id: productId,
      source,
    });

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: true,
          message: productCategory
            ? `You're already on the list for ${productCategory} — we'll be in touch soon.`
            : "You're already on the list — we'll be in touch soon.",
        },
        { status: 409 },
      );
    }

    if (error) throw error;

    const message = isRestock
      ? `You're on the list! We'll email you when ${displayName} is back in stock.`
      : productCategory
        ? `You're on the list! We'll email you when ${productCategory} launches.`
        : "We'll notify you when it's available!";

    return NextResponse.json({ success: true, message });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
