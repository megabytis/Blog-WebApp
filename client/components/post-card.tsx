"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LikeButton } from "./like-button"
import type { Post } from "@/lib/types"

export function PostCard({ post }: { post: Post }) {
  const excerpt = post.content.length > 180 ? post.content.slice(0, 180) + "…" : post.content

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-pretty">
          <Link href={`/posts/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{excerpt}</p>
        {!!post.tags?.length && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          By {post.author.username} • {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <LikeButton postId={post.id} />
      </CardFooter>
    </Card>
  )
}
