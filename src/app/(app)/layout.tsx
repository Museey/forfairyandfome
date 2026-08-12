import { requireCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireCurrentUser();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar name={user.name} colorTag={user.colorTag} />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
