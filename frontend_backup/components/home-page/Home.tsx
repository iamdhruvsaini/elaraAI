"use client";

import React from 'react';
import { 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ShoppingBag,
  Lightbulb,
} from "lucide-react";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// --- Types ---
interface ActionItem {
  id: number;
  title: string;
  icon: React.ReactNode;
  count?: string;
  link:string
}

interface BeautyStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
}

interface LookItem {
  id: number;
  title: string;
  image: string;
  likes: string;
}

// --- Mock Data ---
const ACTIONS: ActionItem[] = [
  { id: 1, title: "Start Makeup Now", icon: <Wand2 className="w-6 h-6 text-rose-500" />, link:"/" },
  { id: 2, title: "Schedule Event", icon: <Calendar className="w-6 h-6 text-indigo-500" /> ,link:"/"},
  { id: 3, title: "My Vanity", icon: <ShoppingBag className="w-6 h-6 text-teal-500" />, count: "41 items",link:"/" },
  { id: 4, title: "Face Analysis", icon: <Lightbulb className="w-6 h-6 text-amber-500" />,link:"/face-analysis" },
];

const STATS: BeautyStat[] = [
  { label: "Looks Created", value: "12", icon: "🎨" },
  { label: "Avg Rating", value: "5.0", icon: "⭐" },
  { label: "Skill Improving", value: "+15%", icon: "📈", trend: "text-rose-500" },
];

const RECENT_LOOKS: LookItem[] = [
  { id: 1, title: "Date Night Glam", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400&auto=format&fit=crop", likes: "24" },
  { id: 2, title: "Office Chic", image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=400&auto=format&fit=crop", likes: "18" },
  { id: 3, title: "Western Look", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400&auto=format&fit=crop", likes: "12" },
];

const Home: React.FC = () => {
  const router=useRouter();
  const {currentUser}=useAuth();
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {/* Mobile Shell */}
      <div className="w-full max-w-[440px] h-full relative flex flex-col">
        
        {/* Header Section */}
        <header className="pt-8 pb-4 shrink-0 z-10">
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            Welcome Back <br/>
            {currentUser?.full_name || "Beauty Enthusiast"}!
          </h1>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 pb-24 space-y-6">
          
          {/* Hero Event Card */}
          <section className="bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 p-6 shadow-xl shadow-purple-100">
            {/* Background pattern elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start text-white mb-2">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Priya's Wedding 💒
                </h2>
                <p className="text-sm opacity-90 font-medium">3 days away</p>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                Dec 26
              </span>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 mt-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span className="text-sm font-semibold text-white">Makeup Ready</span>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 border border-white/10">
                <AlertCircle className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-semibold text-white">Products Ready <span className="opacity-70 font-normal ml-1">3 missing</span></span>
              </div>
            </div>

            <button className="w-full bg-white text-rose-500 font-bold py-3 mt-5 shadow-lg active:scale-95 transition-transform">
              Prepare Now
            </button>
          </section>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-2 gap-3">
            {ACTIONS.map(action => (
              <button 
                key={action.id}
                onClick={()=>router.push(action.link)}
                className="bg-white p-4 flex flex-col items-start gap-3 border-1 border-black-600 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-slate-50 flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{action.title}</p>
                  {action.count && <p className="text-[10px] font-bold text-slate-400 mt-1">{action.count}</p>}
                </div>
              </button>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;
