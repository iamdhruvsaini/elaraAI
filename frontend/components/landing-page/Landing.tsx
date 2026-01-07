import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  SparklesIcon,
  Wand2,
  Camera,
  Volume2,
  Shield,
  Star,
} from "lucide-react";
import Link from "next/link";

/*
    Landing Component
    Mobile-first landing page with clear value proposition and social proof.
*/

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="w-full max-w-[440px] mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full mb-6">
            <SparklesIcon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">AI-Powered Beauty</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
            Your Personal <br />
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Makeup Assistant
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-600 text-base leading-relaxed mb-8">
            Voice-guided makeup application based on your skin tone, outfit, and occasion. Beautiful results, every time.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg">
              <Link href="/login">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Get Started Free
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 font-medium text-slate-700 rounded-xl border-slate-200">
              <Link href="/login">
                Already have an account? Sign In
              </Link>
            </Button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-pink-500">10K+</p>
            <p className="text-xs text-slate-500 mt-1">Active Users</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-purple-500">50K+</p>
            <p className="text-xs text-slate-500 mt-1">Looks Created</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-amber-500">4.9</p>
            <p className="text-xs text-slate-500 mt-1">App Rating</p>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">How It Works</h2>
          <div className="space-y-3">
            <FeatureCard
              icon={<Camera className="w-6 h-6 text-pink-500" />}
              title="Analyze Your Face"
              description="AI detects your skin tone, undertone, and face shape for personalized recommendations."
            />
            <FeatureCard
              icon={<Wand2 className="w-6 h-6 text-purple-500" />}
              title="Get Your Plan"
              description="Receive a step-by-step makeup guide tailored to your occasion and outfit."
            />
            <FeatureCard
              icon={<Volume2 className="w-6 h-6 text-indigo-500" />}
              title="Voice-Guided Application"
              description="Hands-free guidance walks you through each step while you apply."
            />
          </div>
        </section>

        {/* Trust Section */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-5 text-center">
            <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Safe & Personalized</h3>
            <p className="text-sm text-slate-600">
              We consider your allergies and skin sensitivity to recommend only safe products for you.
            </p>
          </div>
        </section>

        {/* Testimonial */}
        <section className="mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-slate-700 text-sm mb-4 italic">
              "Finally, an app that understands my skin! The voice guidance is amazing - I can apply makeup without constantly checking my phone."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Priya S.</p>
                <p className="text-xs text-slate-500">Verified User</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="text-center pb-8">
          <p className="text-slate-500 text-sm mb-4">
            Join thousands of women who've transformed their makeup routine
          </p>
          <Button asChild className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-2xl">
            <Link href="/login">
              Start Your Beauty Journey
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
