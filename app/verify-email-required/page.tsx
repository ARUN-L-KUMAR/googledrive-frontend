"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyEmailRequired() {
    const router = useRouter();
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState("");

    const handleResendEmail = async () => {
        setIsResending(true);
        setMessage("");
        try {
            const response = await fetch("/api/auth/resend-verification", {
                method: "POST",
            });
            const data = await response.json();
            if (response.ok) {
                setMessage("Verification email sent! Please check your inbox.");
            } else {
                setMessage(data.message || "Failed to send verification email.");
            }
        } catch (error) {
            setMessage("An error occurred. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Please verify your email address to access your account. We've sent a verification link to your email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <div className={`p-3 rounded-lg text-sm text-center ${message.includes("sent")
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}>
                            {message}
                        </div>
                    )}

                    <Button
                        className="w-full"
                        onClick={handleResendEmail}
                        disabled={isResending}
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4 mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Didn't receive the email? Check your spam folder or click resend above.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
