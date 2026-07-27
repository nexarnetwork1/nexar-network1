import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/api/errors";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("resolve_invoice_share_token", {
      p_token: token,
    });

    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found or expired" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err, "/api/pay");
  }
}
