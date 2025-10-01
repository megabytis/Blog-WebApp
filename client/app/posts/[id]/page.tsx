"use client"

import useSWR from "swr"
import { useParams, useRouter } from "next/navigation"
import type { Post } from "@/lib/types"
import { LikeButton } from "@/components/like-button"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { apiFetch } from "@/lib/api"
import { CommentSection } from "@/components/comment-section"
import Link from "next/link"

export default function PostPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data } = useSWR<Post>(`/posts/${id}`)
  const { user } = useAuth()
  const router = useRouter()

  const canEdit = user && data?.author?.id === user.id

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return
    await apiFetch(`/posts/${id}`, { method: "DELETE" })
    router.push("/")
  }

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <article className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-balance text-3xl font-semibold">{data.title}</h1>
          <p className="text-sm text-muted-foreground">
            By {data.author.username} • {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
        <LikeButton postId={data.id} />
      </header>

      <div className="prose max-w-none text-pretty">{data.content}</div>

      {canEdit && (
        <div className="flex gap-2">
          <Link href={`/posts/${data.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={deletePost}>
            Delete
          </Button>
        </div>
      )}

      <CommentSection postId={data.id} />
    </article>
  )
}
