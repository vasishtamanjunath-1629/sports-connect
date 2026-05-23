import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { Trophy, MapPin } from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [iAmMember, setIAmMember] = useState(false);

  const load = async () => {
    const { data: t } = await supabase.from("teams").select("*, captain:profiles!teams_captain_id_fkey(id, username, full_name, avatar_url)").eq("id", id).maybeSingle();
    setTeam(t);
    const { data: m } = await supabase.from("team_members").select("user_id, profiles!team_members_user_id_fkey(id, username, full_name, avatar_url, role, sport)").eq("team_id", id);
    setMembers(m ?? []);
    if (user) setIAmMember(!!(m ?? []).find((x: any) => x.user_id === user.id));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  const join = async () => {
    if (!user || !team) return;
    await supabase.from("team_members").insert({ team_id: team.id, user_id: user.id });
    load();
  };
  const leave = async () => {
    if (!user || !team) return;
    await supabase.from("team_members").delete().eq("team_id", team.id).eq("user_id", user.id);
    load();
  };

  if (!team) return <AppLayout><Card className="p-8 text-center text-muted-foreground">Loading…</Card></AppLayout>;
  const isCaptain = user?.id === team.captain_id;

  return (
    <AppLayout>
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-hero" />
        <div className="px-6 pb-6 -mt-12 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-card rounded-2xl">
              <AvatarImage src={team.logo_url ?? undefined} />
              <AvatarFallback className="rounded-2xl bg-gradient-accent text-accent-foreground"><Trophy className="h-10 w-10" /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display font-bold text-2xl">{team.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge className="bg-accent/10 text-accent border-0">{team.sport}</Badge>
                {team.city && <Badge variant="secondary"><MapPin className="h-3 w-3 mr-1" />{team.city}</Badge>}
              </div>
            </div>
          </div>
          {!isCaptain && user && (
            iAmMember
              ? <Button variant="outline" onClick={leave}>Leave team</Button>
              : <Button variant="accent" onClick={join}>Join team</Button>
          )}
        </div>
        {team.description && <div className="px-6 pb-6 text-foreground/90 whitespace-pre-wrap">{team.description}</div>}
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="font-display font-semibold flex items-center gap-2">Members <span className="text-sm text-muted-foreground">({members.length})</span></h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {members.map((m) => (
            <Link to={`/u/${m.profiles.username}`} key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
              <Avatar><AvatarImage src={m.profiles.avatar_url ?? undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(m.profiles.full_name)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate">{m.profiles.full_name} {m.user_id === team.captain_id && <Badge className="ml-1 bg-accent/10 text-accent border-0">Captain</Badge>}</p>
                <p className="text-xs text-muted-foreground truncate">@{m.profiles.username} · {m.profiles.sport ?? m.profiles.role}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
