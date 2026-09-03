import { getSession } from "@/lib/session";
import { config } from "@/lib/config";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <div>
      <main className="page page--wide">
        <AdminClient adminName={session?.name || ""} orgName={config.orgName} />
      </main>
    </div>
  );
}
