import { redirect } from "next/navigation";

export default function TreasuryRedirectPage() {
  redirect("/admin/treasury");
}
