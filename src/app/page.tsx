import { redirect } from "next/navigation"
import { ROLE_HOME, getCurrentUser } from "@/lib/auth"

export default async function Home() {
  const user = await getCurrentUser()
  redirect(user ? ROLE_HOME[user.role] : "/login")
}
