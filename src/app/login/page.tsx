import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginPinPad } from "@/components/login-pin-pad";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, colorTag: true },
    orderBy: { role: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="mb-10 text-center">
        <p className="text-sm tracking-[0.3em] text-text-faint uppercase">
          Fairy &amp; Fome
        </p>
        <h1 className="mt-2 text-2xl font-semibold">เข้าสู่ระบบ</h1>
      </div>
      <LoginPinPad users={users} />
    </div>
  );
}
