import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

export default function SignupPage() {
  redirect(authModalHref({ auth: "register" }));
}
