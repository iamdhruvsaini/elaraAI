"use client";

import React from 'react';
import { 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ShoppingBag,
  Camera,
  Scissors,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

// --- Types ---
interface ActionItem {
  id: number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}

// --- Mock Data ---
const ACTIONS: ActionItem[] = [
  { 
    id: 1, 
    title: "Start Makeup", 
    subtitle: "AI-guided session",
    icon: <Wand2 className="w-6 h-6" />, 
    color: "from-pink-500 to-rose-500",
    link: "/makeup-session" 
  },
  { 
    id: 2, 
    title: "Schedule Event", 
    subtitle: "Plan ahead",
    icon: <Calendar className="w-6 h-6" />, 
    color: "from-indigo-500 to-purple-500",
    link: "/" 
  },
  { 
    id: 3, 
    title: "My Vanity", 
    subtitle: "41 products",
    icon: <ShoppingBag className="w-6 h-6" />, 
    color: "from-teal-500 to-emerald-500",
    link: "/vanity-management" 
  },
  { 
    id: 4, 
    title: "Hair Analysis", 
    subtitle: "Get suggestions",
    icon: <Scissors className="w-6 h-6" />, 
    color: "from-purple-500 to-violet-500",
    link: "/hair-analysis" 
  },
];

const Home: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Mobile Shell */}
      <div className="w-full max-w-[440px] mx-auto px-4 pb-24">
        
        {/* Header Section */}
        <header className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-slate-500">Welcome back</p>
            <div className="flex items-center gap-1 bg-pink-100 px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span className="text-xs font-bold text-pink-600">Pro</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser?.full_name || "Beauty Enthusiast"} ✨
          </h1>
        </header>

        {/* Hero Event Card */}
        <section className="bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 rounded-3xl p-5 mb-6 relative overflow-hidden shadow-xl shadow-purple-200">
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start text-white mb-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Upcoming Event 💒
                </h2>
                <p className="text-sm opacity-90 font-medium">Priya's Wedding</p>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold">
                3 days
              </span>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 mb-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span className="text-sm font-medium text-white">Makeup plan ready</span>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-white/10">
                <AlertCircle className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-medium text-white">3 products missing</span>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/makeup-session')}
              className="w-full h-12 bg-white text-purple-600 font-bold rounded-xl hover:bg-white/90 shadow-lg"
            >
              Prepare Now
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map(action => (
              <button 
                key={action.id}
                onClick={() => router.push(action.link)}
                className="bg-white rounded-2xl p-4 flex flex-col items-start gap-3 border border-slate-100 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">{action.title}</p>
                  {action.subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5">{action.subtitle}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Your Progress</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
              <p className="text-2xl font-bold text-pink-500">12</p>
              <p className="text-xs text-slate-500 mt-1">Looks</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
              <p className="text-2xl font-bold text-purple-500">5.0</p>
              <p className="text-xs text-slate-500 mt-1">Rating</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
              <p className="text-2xl font-bold text-emerald-500">+15%</p>
              <p className="text-xs text-slate-500 mt-1">Skill</p>
            </div>
          </div>
        </section>

        {/* Tip Card */}
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-bold text-slate-800 mb-1">Daily Tip</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apply primer 2-3 minutes before foundation for a smoother, longer-lasting finish.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Camera Button */}
      <button
        onClick={() => router.push('/face-analysis')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-2xl shadow-purple-300 flex items-center justify-center active:scale-95 transition-transform z-50"
        aria-label="Face Analysis"
      >
        <Camera className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default Home;
