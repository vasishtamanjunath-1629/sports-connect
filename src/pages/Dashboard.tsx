import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { CalendarDays, MessageSquare, Trophy, Users } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, teams: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [followers, followingC, posts, teams, rp, ev, sg] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("team_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("posts").select("id, content, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("events").select("id, title, sport, starts_at, city").gte("starts_at", new Date().toISOString()).order("starts_at").limit(3),
        supabase.from("profiles").select("id, username, full_name, sport, avatar_url").neq("id", user.id).limit(4),
      ]);
      setStats({ followers: followers.count ?? 0, following: followingC.count ?? 0, posts: posts.count ?? 0, teams: teams.count ?? 0 });
      setRecentPosts(rp.data ?? []);
      setUpcoming(ev.data ?? []);
      setSuggested(sg.data ?? []);
    })();
  }, [user?.id]);

  // profile completion
  const fields = profile ? [profile.full_name, profile.bio, profile.sport, profile.location, profile.avatar_url, profile.cover_url, (profile.skills ?? []).length > 0, profile.achievements] : [];
  const filled = fields.filter(Boolean).length;
  const completion = profile ? Math.round((filled / fields.length) * 100) : 0;

  const Stat = ({ icon: Icon, label, value }: any) => (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent/10 grid place-items-center text-accent"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-2xl font-display font-bold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <h1 className="font-display font-bold text-2xl mb-1">Welcome back, {profile?.full_name?.split(" ")[0]}</h1>
      <p className="text-muted-foreground text-sm mb-5">Here's what's happening on your COMPIT.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat icon={Users} label="Followers" value={stats.followers} />
        <Stat icon={Users} label="Following" value={stats.following} />
        <Stat icon={Trophy} label="Teams" value={stats.teams} />
        <Stat icon={MessageSquare} label="Posts" value={stats.posts} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold">Profile completion</h3>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={completion} className="h-2" />
            <span className="text-sm font-semibold w-12 text-right">{completion}%</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Complete your profile to attract more connections.</p>
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/profile/edit">Complete profile</Link></Button>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent" /> Upcoming events</h3>
          <div className="mt-3 space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
            {upcoming.map((e) => (
              <Link to={`/events/${e.id}`} key={e.id} className="block hover:text-accent">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(e.starts_at), "MMM d · p")} · {e.city ?? e.sport}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display font-semibold">Recent posts</h3>
          <div className="mt-3 space-y-2">
            {recentPosts.length === 0 && <p className="text-sm text-muted-foreground">You haven't posted yet. <Link to="/feed" className="text-accent">Share your first win →</Link></p>}
            {recentPosts.map((p) => (
              <div key={p.id} className="text-sm border-l-2 border-accent pl-3">
                <p className="line-clamp-2">{p.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(p.created_at), "PPp")}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display font-semibold">Suggested connections</h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {suggested.map((s) => (
              <Link to={`/u/${s.username}`} key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                <Avatar><AvatarImage src={s.avatar_url ?? undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(s.full_name)}</AvatarFallback></Avatar>
                <div><p className="font-semibold text-sm">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.sport ?? "Sports pro"}</p></div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
