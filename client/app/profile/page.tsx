"use client"

import { useAuth } from "@/components/auth-provider"

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return <p className="text-sm text-muted-foreground">Please log in.</p>

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="rounded-lg border bg-card p-4">
        <p>
          <span className="font-medium">Username:</span> {user.username}
        </p>
        <p>
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
      </div>
    </div>
  )
}
