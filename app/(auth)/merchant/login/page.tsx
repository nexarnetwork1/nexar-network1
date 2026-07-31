import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

export default function MerchantLoginPage() {
  redirect(authModalHref({ auth: "signin", redirect: "/merchant" }));
}
