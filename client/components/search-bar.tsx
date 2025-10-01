"use client"

import { Input } from "@/components/ui/input"

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="w-full">
      <label className="sr-only" htmlFor="search">
        Search posts
      </label>
      <Input id="search" placeholder="Search posts..." value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
