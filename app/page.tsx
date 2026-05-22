"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { CheckSquare, Users, Zap, Shield, ArrowRight, Trello, } from "lucide-react";
import Navbar from "@/components/navbar";

export default function HomePage() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Organize work and life,{" "}
            <span className="text-blue-600">finally.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Task Manager helps individual move work forward. Collaborate, manage
            projects, and reach new productivity peaks. From high rises to the
            home office, the way your team works is unique—accomplish it all
            with Task Manager.
          </p>

          {!isSignedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton>
                <Button size="lg" className="text-lg px-8">
                  Start for free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Watch demo
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features to help your team collaborate and get more done.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Trello className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">TrelloClone</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© 2026 Task Manager. All rights reserved.</span>
              <span>Built with Next.js & Clerk</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
