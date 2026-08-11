import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_USERS = [
  { name: "Fairy", role: "MANAGER" as const, pin: "1414", colorTag: "#64FFDA" },
  { name: "Fome", role: "CREATOR" as const, pin: "2828", colorTag: "#FFB703" },
];

async function main() {
  for (const seedUser of SEED_USERS) {
    const pinHash = await bcrypt.hash(seedUser.pin, 10);
    await prisma.user.upsert({
      where: { name: seedUser.name },
      update: {},
      create: {
        name: seedUser.name,
        role: seedUser.role,
        pinHash,
        colorTag: seedUser.colorTag,
      },
    });
  }
  console.log("Seeded users:", SEED_USERS.map((u) => `${u.name} (PIN ${u.pin})`).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
