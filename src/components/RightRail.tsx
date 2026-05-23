import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { CalendarDays, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function RightRail() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles").select("id, username, full_name, role, sport, avatar_url")
        .order("created_at", { ascending: false }).limit(10);
      const filtered = (profiles ?? []).filter((p) => p.id !== user?.id).slice(0, 5);
      setSuggestions(filtered);

      const { data: ev } = await supabase
        .from("events").select("id, title, sport, city, starts_at, poster_url")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true }).limit(4);
      setEvents(ev ?? []);

      if (user) {
        const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
        setFollowing(new Set((f ?? []).map((x) => x.following_id)));
      }
    })();
  }, [user?.id]);

  const toggleFollow = async (id: string) => {
    if (!user) return;
    if (following.has(id)) {
      setFollowing((s) => { const n = new Set(s); n.delete(id); return n; });
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    } else {
      setFollowing((s) => new Set(s).add(id));
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-display font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Suggested for you</h3>
        <div className="mt-3 space-y-3">
          {suggestions.length === 0 && <p className="text-xs text-muted-foreground">No suggestions yet.</p>}
          {suggestions.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <Link to={`/u/${p.username}`}>
                <Avatar className="h-9 w-9"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials(p.full_name)}</AvatarFallback></Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/u/${p.username}`} className="text-sm font-semibold leading-tight block truncate hover:text-accent">{p.full_name}</Link>
                <p className="text-xs text-muted-foreground truncate">{p.sport ?? p.role}</p>
              </div>
              <Button size="sm" variant={following.has(p.id) ? "outline" : "accent"} onClick={() => toggleFollow(p.id)}>
                {following.has(p.id) ? "Following" : "Follow"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-display font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent" /> Upcoming events</h3>
        <div className="mt-3 space-y-3">
          {events.length === 0 && <p className="text-xs text-muted-foreground">No events scheduled.</p>}
          {events.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="block group">
              <p className="text-sm font-semibold leading-tight group-hover:text-accent truncate">{e.title}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(e.starts_at), "MMM d · p")} · {e.city ?? e.sport}</p>
            </Link>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="w-full mt-4"><Link to="/events">Browse all</Link></Button>
      </Card>
    </div>
  );
}
