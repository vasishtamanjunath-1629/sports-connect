import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { MapPin, Globe, Pencil, Trophy, Users as UsersIcon } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PostFeed from "@/components/PostFeed";
import RightRail from "@/components/RightRail";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABEL: Record<string, string> = { athlete: "Athlete", coach: "Coach", organizer: "Event Organizer", team_manager: "Team Manager" };

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [p, setP] = useState<any>(null);
  const [stats, setStats] = useState({ followers: 0, following: 0, teams: 0 });
  const [iFollow, setIFollow] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: prof } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    if (!prof) { setLoading(false); return; }
    setP(prof);
    const [{ count: followers }, { count: followingCount }, { count: teams }, my] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", prof.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", prof.id),
      supabase.from("team_members").select("*", { count: "exact", head: true }).eq("user_id", prof.id),
      user ? supabase.from("follows").select("*").eq("follower_id", user.id).eq("following_id", prof.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setStats({ followers: followers ?? 0, following: followingCount ?? 0, teams: teams ?? 0 });
    setIFollow(!!my.data);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [username, user?.id]);

  const toggleFollow = async () => {
    if (!user || !p) return;
    if (iFollow) {
      setIFollow(false); setStats((s) => ({ ...s, followers: s.followers - 1 }));
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", p.id);
    } else {
      setIFollow(true); setStats((s) => ({ ...s, followers: s.followers + 1 }));
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: p.id });
      if (error) toast({ title: "Couldn't follow", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <AppLayout right={<RightRail />}><Card className="p-8 text-center text-muted-foreground">Loading…</Card></AppLayout>;
  if (!p) return <AppLayout right={<RightRail />}><Card className="p-8 text-center"><p>User not found.</p><Button asChild className="mt-4"><Link to="/feed">Back to feed</Link></Button></Card></AppLayout>;

  const isMe = user?.id === p.id;

  return (
    <AppLayout right={<RightRail />}>
      <Card className="overflow-hidden shadow-sm">
        <div className="h-44 md:h-56 bg-gradient-hero relative">
          {p.cover_url && <img src={p.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6 -mt-14 md:-mt-16">
          <div className="flex flex-wrap items-end gap-4 justify-between">
            <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-card">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials(p.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              {isMe ? (
                <Button asChild variant="outline"><Link to="/profile/edit"><Pencil className="h-4 w-4" /> Edit profile</Link></Button>
              ) : (
                <>
                  <Button variant={iFollow ? "outline" : "accent"} onClick={toggleFollow}>{iFollow ? "Following" : "Follow"}</Button>
                  <Button variant="outline" asChild><Link to="/messages">Message</Link></Button>
                </>
              )}
            </div>
          </div>
          <div className="mt-4">
            <h1 className="font-display font-bold text-2xl md:text-3xl">{p.full_name}</h1>
            <p className="text-muted-foreground">@{p.username}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{ROLE_LABEL[p.role]}</Badge>
              {p.sport && <Badge className="bg-accent/10 text-accent border-0 hover:bg-accent/20">{p.sport}</Badge>}
            </div>
            {p.bio && <p className="mt-4 text-foreground/90 max-w-2xl whitespace-pre-wrap">{p.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {p.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{p.location}</span>}
              {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-accent"><Globe className="h-4 w-4" />{p.website.replace(/^https?:\/\//, "")}</a>}
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <span><strong className="text-foreground">{stats.followers}</strong> <span className="text-muted-foreground">followers</span></span>
              <span><strong className="text-foreground">{stats.following}</strong> <span className="text-muted-foreground">following</span></span>
              <span><strong className="text-foreground">{stats.teams}</strong> <span className="text-muted-foreground">teams</span></span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="posts" className="mt-4">
        <TabsList className="bg-card">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4"><PostFeed userId={p.id} /></TabsContent>
        <TabsContent value="about" className="mt-4">
          <Card className="p-6 space-y-3">
            <h3 className="font-display font-semibold flex items-center gap-2"><UsersIcon className="h-4 w-4 text-accent" /> About</h3>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{p.bio || "No bio yet."}</p>
            {p.skills && p.skills.length > 0 && (
              <div>
                <p className="text-sm font-semibold mt-4 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {p.skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="achievements" className="mt-4">
          <Card className="p-6">
            <h3 className="font-display font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Achievements</h3>
            <p className="text-sm mt-3 whitespace-pre-wrap text-foreground/90">{p.achievements || "No achievements added yet."}</p>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
