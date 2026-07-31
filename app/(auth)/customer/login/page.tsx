import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

export default function CustomerLoginPage() {
  redirect(authModalHref({ auth: "signin", redirect: "/marketplace" }));
}
