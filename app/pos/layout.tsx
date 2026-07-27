import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Point of Sale | Nexar Network",
  description: "In-person payment solutions for retail and physical businesses.",
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
