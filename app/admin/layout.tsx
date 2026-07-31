import { AdminNexarAssistant } from "./AdminNexarAssistant";

export const metadata = {
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
