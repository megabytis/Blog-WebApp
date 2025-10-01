"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, qs } from "@/lib/api";
import type { Comment, PaginatedResult } from "@/lib/types";
import { useAuth } from "./auth-provider";

export function CommentSection({ postId }: { postId: string }) {
  const [page, setPage] = useState(1);
  const limit = 3;
  const key = `/posts/${postId}/comments${qs({ page, limit })}`;
  const { data } = useSWR<PaginatedResult<Comment>>(key);
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const addComment = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        json: { content: text },
        credentials: "include",
      });
      setText("");
      mutate(key);
      toast({ title: "Comment added" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await apiFetch(`/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      mutate(key);
      toast({ title: "Comment deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="flex gap-2">
            <Input
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button onClick={addComment} disabled={loading}>
              Post
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Please log in to comment.
          </p>
        )}

        <div className="space-y-3">
          {data?.items?.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between rounded-md border p-3"
            >
              <div>
                <p className="text-sm">{c.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  By {c.author.username} •{" "}
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
              {user?.id === c.author.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComment(c.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          ))}
          {!data?.items?.length && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
