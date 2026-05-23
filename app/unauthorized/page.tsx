"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
    const { user } = useUser();
    const email = user?.emailAddresses[0]?.emailAddress || "your account";
    const username = user?.username ? `@${user.username}` : "";

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-white border border-zinc-200/80 shadow-xl rounded-3xl p-8 sm:p-10 text-center relative z-10">
                {/* Shield Alert Icon */}
                <div className="mx-auto h-16 w-16 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <ShieldAlert className="h-8 w-8 text-purple-600 animate-pulse" />
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl font-bold text-zinc-950 mb-3">
                    Access Restricted
                </h1>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                    This is a private instance of the <span className="font-semibold text-zinc-900">Task Management</span> application. 
                    Your logged-in account <span className="font-medium text-purple-600 break-all">{email}</span> {username && <span className="text-zinc-500">({username})</span>} is not on the whitelist of authorized users.
                </p>

                {/* Info Note */}
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 mb-8 text-xs text-zinc-500 text-left leading-relaxed">
                    <p className="font-semibold text-zinc-700 mb-1">How do I get access?</p>
                    Please contact the administrator to add your email or GitHub username to the <code className="bg-zinc-200/50 px-1 py-0.5 rounded text-purple-600 font-mono">ALLOWED_USERS</code> environment variable in Vercel.
                </div>

                {/* CTA Actions */}
                <div className="flex flex-col space-y-3">
                    <SignOutButton redirectUrl="/">
                        <Button className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-xl h-11 flex items-center justify-center space-x-2 transition-all">
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out / Switch Account</span>
                        </Button>
                    </SignOutButton>

                    <Link href="/">
                        <Button variant="ghost" className="w-full text-zinc-600 hover:text-zinc-900 font-medium h-11 flex items-center justify-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Homepage</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
