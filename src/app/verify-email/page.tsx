"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [resendError, setResendError] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage("")
    setResendError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        setResendMessage("Verification email sent successfully! Please check your inbox.")
      } else {
        try {
          const errorData = await response.json()
          setResendError(errorData.detail || "Failed to resend email. Please try again.")
        } catch {
          setResendError("Failed to resend email. Please try again.")
        }
      }
    } catch (err) {
      setResendError("An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center dark bg-background  px-4 ">
      <div className="w-full max-w-md space-y-8">
        <Card className="border-none inset bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-primary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Check your email
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              We've sent a verification link to
            </CardDescription>
            <p className="text-sm font-medium text-foreground mt-2">
              {email}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please check your email and click on the verification link to activate your account.
              </p>
            </div>

            {resendMessage && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm text-center">
                {resendMessage}
              </div>
            )}

            {resendError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {resendError}
              </div>
            )}

            <Button 
              onClick={handleResendEmail}
              className="w-full h-12 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              size="lg"
              disabled={isResending}
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resending...
                </span>
              ) : (
                "Resend verification email"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button 
                  variant="outline"
                  className="w-full h-12 rounded-xl bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                >
                  Back to login
                </Button>
              </Link>
              
              <Link href="/signup">
                <Button 
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  Try signing up with a different email
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              If you continue to have issues, please contact our support team
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}