"use client"

import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"

export function LikeButton({ postId }: { postId: string }) {
  const countKey = `/posts/${postId}/likes/count`
  const { data, isLoading } = useSWR<{ count: number }>(countKey)

  const like = async () => {
    await apiFetch(`/posts/${postId}/like`, { method: "POST" })
    mutate(countKey)
  }

  return (
    <Button variant="secondary" size="sm" onClick={like} disabled={isLoading}>
      ❤️ {data?.count ?? 0}
    </Button>
  )
}
