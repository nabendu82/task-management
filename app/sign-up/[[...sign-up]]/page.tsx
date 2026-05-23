import { redirect } from "next/navigation";

export default function SignUpPage() {
    // Redirect any direct sign-up traffic to the sign-in page to prevent accidental account creation
    redirect("/sign-in");
}
