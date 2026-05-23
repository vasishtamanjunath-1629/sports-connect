import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, CalendarDays, Zap, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopNav from "@/components/TopNav";
import hero from "@/assets/hero-stadium.jpg";

const features = [
  { icon: Users, title: "Build your network", desc: "Connect with athletes, coaches, scouts and clubs across every sport." },
  { icon: Trophy, title: "Showcase achievements", desc: "Post wins, medals, training clips. Let your trophy case speak." },
  { icon: CalendarDays, title: "Discover events", desc: "Tournaments, trials, camps. Register in one tap." },
  { icon: Zap, title: "Form teams instantly", desc: "Recruit teammates, manage rosters, communicate as one squad." },
  { icon: MessageSquare, title: "Real conversations", desc: "Direct messages with coaches, organizers, and teammates." },
  { icon: Star, title: "Get discovered", desc: "Trending feed, suggested profiles, and a verified pro presence." },
];

const testimonials = [
  { name: "Maya R.", role: "Track Athlete · Nairobi", quote: "I landed a scholarship trial within 3 weeks. COMPIT made my profile impossible to ignore." },
  { name: "Coach Daniel O.", role: "Football · Lagos", quote: "Recruiting talent used to take months. Now I scout, message and onboard in one place." },
  { name: "Aria T.", role: "Swimmer · Dubai", quote: "The community is electric. Every win I post gets seen by people who actually matter." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      {/* HERO */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <div className="container max-w-[1280px] pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Global Sports Network
            </span>
            <h1 className="mt-6 font-display font-bold text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-balance">
              Where every athlete <span className="bg-gradient-accent bg-clip-text text-transparent">gets discovered.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl text-balance">
              COMPIT is the professional network built for sport. Build your profile, post your achievements, join teams, and register for events — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="accent" size="xl" asChild>
                <Link to="/auth?mode=signup">Join COMPIT free <ArrowRight className="h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/auth">I have an account</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div><span className="text-2xl font-display font-bold text-foreground">25k+</span><br/>Athletes</div>
              <div className="h-10 w-px bg-border" />
              <div><span className="text-2xl font-display font-bold text-foreground">1.2k</span><br/>Teams</div>
              <div className="h-10 w-px bg-border" />
              <div><span className="text-2xl font-display font-bold text-foreground">300+</span><br/>Events / month</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} className="relative">
            <div className="absolute -inset-6 bg-gradient-accent opacity-30 blur-3xl rounded-[3rem]" />
            <img
              src={hero}
              alt="Athletes competing in a stadium at golden hour"
              width={1920}
              height={1280}
              className="relative rounded-3xl shadow-elevated object-cover w-full aspect-[4/3]"
            />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 lg:py-28 border-t border-border">
        <div className="container max-w-[1280px]">
          <div className="max-w-2xl">
            <span className="text-accent text-sm font-semibold uppercase tracking-wider">Everything you need</span>
            <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl tracking-tight text-balance">
              Built for the way athletes actually work.
            </h2>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/40 hover:shadow-elevated transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-accent/10 grid place-items-center text-accent group-hover:bg-gradient-accent group-hover:text-accent-foreground transition-all">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
        <div className="container max-w-[1280px] relative">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-balance max-w-2xl">
            Loved by athletes <span className="text-accent">building real careers.</span>
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-7 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur">
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-lg leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 pt-5 border-t border-primary-foreground/10">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-primary-foreground/60">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="container max-w-[1280px]">
          <div className="rounded-3xl bg-gradient-hero p-12 lg:p-20 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
            <div className="relative">
              <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight text-balance">
                Your sport. Your story. <br/><span className="text-accent">Start writing it.</span>
              </h2>
              <p className="mt-5 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                Free forever for athletes. Sign up in 30 seconds.
              </p>
              <Button variant="accent" size="xl" asChild className="mt-8">
                <Link to="/auth?mode=signup">Create my profile <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-border">
        <div className="container max-w-[1280px] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="font-display font-semibold text-foreground">COMPIT</span>
            <span>· Global Sports Networking</span>
          </div>
          <p>© {new Date().getFullYear()} COMPIT. Built for athletes everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
