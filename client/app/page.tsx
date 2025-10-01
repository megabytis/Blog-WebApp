"use client"

import useSWR from "swr"
import { qs } from "@/lib/api"
import { SearchBar } from "@/components/search-bar"
import { TagFilter } from "@/components/tag-filter"
import { Pagination } from "@/components/pagination"
import { PostCard } from "@/components/post-card"
import type { PaginatedResult, Post } from "@/lib/types"
import { useState } from "react"

export default function HomePage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState("")
  const [tags, setTags] = useState("")

  const key = `/posts${qs({
    page,
    limit,
    search: search || undefined,
    tags:
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(",") || undefined,
  })}`
  const { data, isLoading } = useSWR<PaginatedResult<Post>>(key)

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchBar value={search} onChange={setSearch} />
          <TagFilter value={tags} onChange={setTags} />
        </div>
      </section>

      {isLoading && <p className="text-sm text-muted-foreground">Loading posts…</p>}

      <section className="grid gap-4">
        {data?.items?.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {!isLoading && !data?.items?.length && <p className="text-sm text-muted-foreground">No posts found.</p>}
      </section>

      {!!data && <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={(p) => setPage(p)} />}
    </div>
  )
}
