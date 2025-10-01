"use client"

import SignupForm from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <SignupForm />
    </div>
  )
}
