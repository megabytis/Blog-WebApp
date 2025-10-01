"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"
import type { Post } from "@/lib/types"

export function PostEditor({
  initial,
}: {
  initial?: Partial<Post>
}) {
  const [title, setTitle] = useState(initial?.title || "")
  const [content, setContent] = useState(initial?.content || "")
  const [tags, setTags] = useState((initial?.tags || []).join(","))
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const isEditing = Boolean(initial?.id)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title,
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }
      if (isEditing) {
        const updated = await apiFetch<Post>(`/posts/${initial!.id}`, {
          method: "PATCH",
          json: payload,
        })
        toast({ title: "Post updated" })
        router.push(`/posts/${updated.id}`)
      } else {
        const created = await apiFetch<Post>("/posts", {
          method: "POST",
          json: payload,
        })
        toast({ title: "Post created" })
        router.push(`/posts/${created.id}`)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          Content
        </label>
        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} required />
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">
          Tags
        </label>
        <Input
          id="tags"
          placeholder="Comma-separated (e.g. js,node,express)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {isEditing ? "Save Changes" : "Create Post"}
        </Button>
      </div>
    </form>
  )
}
