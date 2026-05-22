"use client";

import { useEffect, useRef } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trello, Calendar, Clock, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar";
import Link from "next/link";

export default function HomePage() {
  const { isSignedIn } = useUser();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseVx: number;
      baseVy: number;
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(300, Math.floor((width * height) / 5000));
    const colors = [
      "#ef4444", // red
      "#f97316", // orange
      "#a855f7", // purple
      "#6366f1", // indigo
      "#3b82f6", // blue
      "#06b6d4", // cyan
      "#10b981", // emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      const vx = (Math.random() - 0.5) * 1.6;
      const vy = (Math.random() - 0.5) * 1.6;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: vx,
        vy: vy,
        baseVx: vx,
        baseVy: vy,
        radius: Math.random() * 1.5 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = null;
      mouseY = null;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw and update particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse attraction/gravity force
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            p.vx += (dx / dist) * force * 0.05;
            p.vy += (dy / dist) * force * 0.05;
          } else {
            p.vx += (p.baseVx - p.vx) * 0.03;
            p.vy += (p.baseVy - p.vy) * 0.03;
          }
        } else {
          p.vx += (p.baseVx - p.vx) * 0.03;
          p.vy += (p.baseVy - p.vy) * 0.03;
        }

        // Limit speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2.2) {
          p.vx = (p.vx / speed) * 2.2;
          p.vy = (p.vy / speed) * 2.2;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 relative overflow-hidden flex flex-col justify-between">
      {/* Background Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center relative z-10 py-16 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Glow Background Element */}
            <div className="w-72 h-72 rounded-full bg-blue-500/5 blur-[120px] absolute -top-12 z-0 pointer-events-none" />

            {/* Sparkles Teaser Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-white/80 backdrop-blur-sm text-xs font-medium text-zinc-700 mb-8 shadow-sm relative z-10">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Personal Focus Workspace + Interactive Calendar Coming Soon</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-950 mb-6 relative z-10 leading-[1.15]">
              Organize your flow, <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                effortlessly.
              </span>
            </h1>
            {/* Description */}
            <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed relative z-10 font-normal">
              A minimalist personal task manager built to help you track goals, organize side projects, and visualize your time. Features custom task boards and a calendar timeline coming soon.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 w-full sm:w-auto">
              {isSignedIn ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-md transition-all">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <SignUpButton>
                    <Button size="lg" className="text-lg px-8 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-md transition-all">Get Started Free<ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </SignUpButton>
                  <SignInButton>
                    <Button variant="outline" size="lg" className="text-lg px-8 rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 transition-all shadow-sm">
                      Sign In
                    </Button>
                  </SignInButton>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Visual Task Boards */}
          <div className="group relative border border-zinc-200/50 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 transition-all hover:border-zinc-300
           hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trello className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Visual Kanban Boards</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Organize daily routines, side projects, and study schedules. Custom boards help you visualize work stages and drag tasks seamlessly.
              </p>
            </div>
          </div>

          {/* Calendar Timeline */}
          <div className="group relative border border-zinc-200/50 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 transition-all hover:border-zinc-300 
          hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <span className="text-[10px] tracking-wider font-bold px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-600">
                  COMING SOON
                </span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Interactive Calendar</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Plan your weeks visually. Drag, drop, and schedule tasks directly onto a beautiful timeline view to balance your personal workflow.
              </p>
            </div>
          </div>

          {/* Zen Focus */}
          <div className="group relative border border-zinc-200/50 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 transition-all hover:border-zinc-300 
          hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">Distraction-Free</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Crafted for personal focus. No team pings, comments, or shared deadlines. Just your space to track tasks and achieve consistency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 bg-white/80 backdrop-blur-md py-8 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Trello className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-zinc-950 tracking-wide">Task Management</span>
          </div>
          <div className="flex items-center space-x-6 text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} Task Management. All rights reserved.</span>
            <span>Built with Next.js & Clerk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
