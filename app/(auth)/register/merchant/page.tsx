import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

export default function MerchantRegisterPage() {
  redirect(authModalHref({ auth: "register", role: "merchant" }));
}
