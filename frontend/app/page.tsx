import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  EyeIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

const LiveBadge = () => {
  return (
    <Badge
      variant="outline"
      className="px-4 py-2 mb-8 text-sm backdrop-blur-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="text-muted-foreground">
        Your personal, voice-guided makeup assistant
      </span>
    </Badge>
  );
};

const statsData = [
  {
    icon: RocketIcon,
    value: "Smart",
    label: "Makeup Planning",
  },
  {
    icon: UsersIcon,
    value: "Inclusive",
    label: "For Every Skin Tone",
    hasBorder: true,
  },
  {
    icon: EyeIcon,
    value: "Hands-Free",
    label: "Voice Guidance",
  },
];

export default function Home() {
  return (
    <section className="relative overflow-hidden">
      <div className="wrapper">
        <div className="flex flex-col items-center justify-center lg:py-24 py-12 text-center">
          <LiveBadge />
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl">
            Plan Your Makeup, Apply With Confidence
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            A voice-guided platform that helps you plan and apply makeup based
            on your skin tone, outfit, occasion, and available products. Simple,
            safe, and personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button asChild size="lg" className="text-base px-8 shadow-lg">
              <Link href="/get-started">
                <SparklesIcon className="size-5" />
                Start Your Makeup Plan
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="text-base px-8 shadow-lg"
              variant="secondary"
            >
              <Link href="/explore">
                Explore How It Works <ArrowRightIcon className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
