import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/errors";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("resolve_qr_token", {
      p_token: token,
    });

    if (error || !data) {
      return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 404 });
    }

    const resolved = data as {
      qr_type: string;
      store_slug: string;
      store_mode: string;
    };

    if (resolved.qr_type === "payment_only" || resolved.store_mode === "payments_only") {
      return NextResponse.redirect(
        new URL(`/pay/s/${resolved.store_slug}`, process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    return NextResponse.redirect(
      new URL(`/store/${resolved.store_slug}`, process.env.NEXT_PUBLIC_APP_URL)
    );
  } catch (err) {
    return handleApiError(err, "/api/qr");
  }
}
