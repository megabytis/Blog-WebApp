export type User = {
  id: string
  username: string
  email: string
}

export type Post = {
  id: string
  title: string
  content: string
  tags: string[]
  author: { id: string; username: string }
  createdAt: string
  updatedAt?: string
}

export type Comment = {
  id: string
  content: string
  author: { id: string; username: string }
  createdAt: string
}

export type PaginatedResult<T> = {
  items: T[]
  page: number
  limit: number
  total: number
}

export type AuthResponse = {
  token: string
  user: User
}
