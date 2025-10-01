"use client"

import { PostEditor } from "@/components/post-editor"
import { useAuth } from "@/components/auth-provider"

export default function CreatePostPage() {
  const { user } = useAuth()

  if (!user) {
    return <p className="text-sm text-muted-foreground">Please log in to create a post.</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Create Post</h1>
      <PostEditor />
    </div>
  )
}
