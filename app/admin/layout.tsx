import type { Metadata } from "next";
import { AdminNexarAssistant } from "./AdminNexarAssistant";
import { privateAreaMetadata } from "@/lib/constants/seo";

export const metadata: Metadata = {
  ...privateAreaMetadata,
  title: "Nexar CMS",
  description: "Nexar Network Control Center",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AdminNexarAssistant />
      </body>
    </html>
  );
}
