import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const username = (process.env.ADMIN_USERNAME ?? "admin@riset.com").toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error("ADMIN_PASSWORD belum diset di .env")

  await db.user.upsert({
    where: { username },
    update: {},
    create: {
      name: "Admin Utama",
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      mustChangePassword: false,
    },
  })
  console.log(`Admin siap: ${username}`)
}

main().finally(() => db.$disconnect())
