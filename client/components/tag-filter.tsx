"use client"

import { Input } from "@/components/ui/input"

export function TagFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="w-full">
      <label className="sr-only" htmlFor="tags">
        Filter by tags
      </label>
      <Input
        id="tags"
        placeholder="Tags (comma-separated, e.g. js,node,express)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
