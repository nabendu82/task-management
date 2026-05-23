import { SignIn } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient background decoration */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
            
            <div className="w-full max-w-[400px] bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-4 text-xs text-amber-800 flex items-start space-x-2.5 relative z-10 shadow-xs">
                <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold">Private Instance Notice:</span> This application workspace is private. Only accounts registered on the administrator whitelist can access the dashboard.
                </div>
            </div>

            <div className="relative z-10">
                <SignIn />
            </div>
        </div>
    );
}
