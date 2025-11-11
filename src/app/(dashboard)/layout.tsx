import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardNavbar } from "@/components/DashboardNavbar";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.user?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex flex-row-reverse min-h-screen bg-gray-50" dir="rtl">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar user={session.user} />
        <main className="flex-1 p-6 mt-16 overflow-y-auto">{children}</main>
      </div>
      <DashboardSidebar />

    </div>
  );
};

export default DashboardLayout;

