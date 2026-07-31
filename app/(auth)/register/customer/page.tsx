import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

export default function CustomerRegisterPage() {
  redirect(authModalHref({ auth: "register", role: "customer" }));
}
