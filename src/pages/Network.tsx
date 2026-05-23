import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { Search } from "lucide-react";

export default function Network() {
  const { user } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase.from("profiles").select("id, username, full_name, role, sport, location, avatar_url, bio").order("created_at", { ascending: false }).limit(100);
    setPeople((data ?? []).filter((p) => p.id !== user?.id));
    if (user) {
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      setFollowing(new Set((f ?? []).map((x) => x.following_id)));
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const toggle = async (id: string) => {
    if (!user) return;
    if (following.has(id)) {
      setFollowing((s) => { const n = new Set(s); n.delete(id); return n; });
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
    } else {
      setFollowing((s) => new Set(s).add(id));
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
    }
  };

  const filtered = people.filter((p) => !q || `${p.full_name} ${p.username} ${p.sport ?? ""} ${p.location ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <h1 className="font-display font-bold text-2xl mb-1">Your network</h1>
      <p className="text-muted-foreground text-sm mb-4">Discover athletes, coaches and organizers worldwide.</p>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search people, sport, city" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.length === 0 && <Card className="p-8 text-center col-span-full text-muted-foreground">No matches.</Card>}
        {filtered.map((p) => (
          <Card key={p.id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <Link to={`/u/${p.username}`}><Avatar className="h-12 w-12"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(p.full_name)}</AvatarFallback></Avatar></Link>
            <div className="flex-1 min-w-0">
              <Link to={`/u/${p.username}`} className="font-semibold leading-tight block truncate hover:text-accent">{p.full_name}</Link>
              <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.sport && <Badge className="bg-accent/10 text-accent border-0 text-[10px]">{p.sport}</Badge>}
              </div>
            </div>
            <Button size="sm" variant={following.has(p.id) ? "outline" : "accent"} onClick={() => toggle(p.id)}>
              {following.has(p.id) ? "Following" : "Follow"}
            </Button>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
