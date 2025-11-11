import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AccountView from "@/modules/account/ui/views/account-view";

const page = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    
    if (!session) {
        redirect("/");
    }
    
    return <AccountView user={session.user} />;
};

export default page;

