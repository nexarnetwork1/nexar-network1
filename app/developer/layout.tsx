import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Portal | Nexar Network",
  description: "Build with Nexar Network's APIs and SDKs.",
};

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
