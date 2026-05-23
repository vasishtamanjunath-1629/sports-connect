import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { v: "athlete", l: "Athlete" },
  { v: "coach", l: "Coach" },
  { v: "organizer", l: "Event Organizer" },
  { v: "team_manager", l: "Team Manager" },
];

export default function Auth() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("athlete");
  const [sport, setSport] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/feed`,
            data: { full_name: fullName, role, sport },
          },
        });
        if (error) throw error;
        toast({ title: "Welcome to COMPIT!", description: "Your account is ready. Loading your feed…" });
        nav("/feed");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/feed");
      }
    } catch (err: any) {
      toast({ title: "Authentication error", description: err.message ?? "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative bg-gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-accent grid place-items-center shadow-glow">
            <Trophy className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">COMPIT</span>
        </Link>
        <div className="relative">
          <h2 className="font-display font-bold text-5xl leading-tight text-balance">
            Where every athlete <span className="text-accent">gets discovered.</span>
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-md">
            Join 25,000+ athletes, coaches, and organizers building careers on the world's sports network.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">© {new Date().getFullYear()} COMPIT</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-gradient-accent grid place-items-center"><Trophy className="h-5 w-5 text-accent-foreground" /></div>
            <span className="font-display font-bold text-xl">COMPIT</span>
          </Link>
          <Card className="p-8 shadow-elevated border-border/60">
            <h1 className="font-display font-bold text-3xl">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === "signup" ? "Start building your sports profile in seconds." : "Sign in to continue your journey."}
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maya Rodriguez" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>I am a</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLES.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sport">Primary sport</Label>
                      <Input id="sport" value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Football" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-center text-muted-foreground">
              {mode === "signup" ? "Already on COMPIT?" : "New to COMPIT?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="text-accent font-semibold hover:underline"
              >
                {mode === "signup" ? "Sign in" : "Create an account"}
              </button>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
