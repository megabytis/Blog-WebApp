"use client"

import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-primary">
            Blog
          </Link>
          <nav className="hidden gap-4 sm:flex">
            <Link
              href="/"
              className={cn("text-sm text-muted-foreground hover:text-foreground", {
                "text-foreground font-medium": pathname === "/",
              })}
            >
              Home
            </Link>
            <Link
              href="/create-post"
              className={cn("text-sm text-muted-foreground hover:text-foreground", {
                "text-foreground font-medium": pathname?.startsWith("/create-post"),
              })}
            >
              Create Post
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Signed in as <span className="font-medium text-foreground">{user.username}</span>
              </span>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Link href="/profile">
                <Button variant="secondary" size="sm">
                  Profile
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={async () => {
                  await logout()
                  router.push("/")
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
