import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that can be accessed without authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/unauthorized'
]);

export default clerkMiddleware(async (auth, req) => {
    const authObject = await auth();
    const { userId } = authObject;

    // 1. If it's a public route, let the request pass
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // 2. If the user is not authenticated, redirect to Clerk sign-in
    if (!userId) {
        return authObject.redirectToSignIn({ returnBackUrl: req.url });
    }

    // 3. Access Control / Whitelist validation
    const allowedUsersEnv = process.env.ALLOWED_USERS || "";
    if (allowedUsersEnv) {
        const allowedList = allowedUsersEnv
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);

        if (allowedList.length > 0) {
            try {
                // Initialize clerkClient
                const client = await clerkClient();
                // Fetch full user details from Clerk API
                const user = await client.users.getUser(userId);

                const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
                const username = user.username?.toLowerCase();

                // Check if user's email or username matches any entries in ALLOWED_USERS
                const isAllowed = emails.some((email) => allowedList.includes(email)) || 
                                  (username && allowedList.includes(username));

                if (!isAllowed) {
                    // Redirect to the unauthorized page if the user is not whitelisted
                    const unauthorizedUrl = new URL('/unauthorized', req.url);
                    return NextResponse.redirect(unauthorizedUrl);
                }
            } catch (err) {
                console.error("Error validating user in middleware:", err);
                // On request validation error, let user pass (or we could choose to block)
            }
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};