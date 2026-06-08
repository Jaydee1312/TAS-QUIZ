import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <div className="container py-8">{children}</div>
    </div>
  );
}
