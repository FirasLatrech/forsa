import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminView from "@/modules/admin/ui/views/admin-view";

const page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.user?.isAdmin) {
    redirect("/");
  }

  return <AdminView />;
};

export default page;

