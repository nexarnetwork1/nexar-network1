import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Nexar Network",
  description: "Complete documentation for Nexar Network platform.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
