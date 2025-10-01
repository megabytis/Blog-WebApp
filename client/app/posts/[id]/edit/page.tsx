"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import type { Post } from "@/lib/types"
import { PostEditor } from "@/components/post-editor"
import { useAuth } from "@/components/auth-provider"

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>()
  const { data } = useSWR<Post>(`/posts/${id}`)
  const { user } = useAuth()

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!user || data.author.id !== user.id) return <p className="text-sm text-muted-foreground">Not authorized.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Post</h1>
      <PostEditor initial={data} />
    </div>
  )
}
