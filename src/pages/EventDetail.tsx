import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ev, setEv] = useState<any>(null);
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [registered, setRegistered] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("events").select("*, organizer:profiles!events_organizer_id_fkey(id, username, full_name, avatar_url)").eq("id", id).maybeSingle();
    setEv(data);
    const { data: regs } = await supabase.from("event_registrations").select("user_id, profiles!event_registrations_user_id_fkey(username, full_name, avatar_url)").eq("event_id", id);
    setRegistrants(regs ?? []);
    if (user) setRegistered(!!(regs ?? []).find((r: any) => r.user_id === user.id));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  const register = async () => {
    if (!user) return;
    await supabase.from("event_registrations").insert({ event_id: id, user_id: user.id });
    load();
  };
  const cancel = async () => {
    if (!user) return;
    await supabase.from("event_registrations").delete().eq("event_id", id).eq("user_id", user.id);
    load();
  };

  if (!ev) return <AppLayout><Card className="p-8 text-center text-muted-foreground">Loading…</Card></AppLayout>;

  return (
    <AppLayout>
      <Card className="overflow-hidden">
        <div className="aspect-[16/7] bg-gradient-hero relative">
          {ev.poster_url && <img src={ev.poster_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-6">
          <Badge className="bg-accent text-accent-foreground border-0">{ev.sport}</Badge>
          <h1 className="font-display font-bold text-3xl mt-3">{ev.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{format(new Date(ev.starts_at), "EEE, MMM d · p")}</span>
            {ev.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{ev.venue ? `${ev.venue}, ${ev.city}` : ev.city}</span>}
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{registrants.length} registered</span>
          </div>
          {ev.description && <p className="mt-5 whitespace-pre-wrap text-foreground/90">{ev.description}</p>}
          <div className="mt-6 flex gap-3">
            {user && (registered
              ? <Button variant="outline" onClick={cancel}>Cancel registration</Button>
              : <Button variant="accent" onClick={register}>Register now</Button>)}
          </div>
          <div className="mt-8 flex items-center gap-3 pt-6 border-t border-border">
            <span className="text-sm text-muted-foreground">Organized by</span>
            <Link to={`/u/${ev.organizer?.username}`} className="flex items-center gap-2 hover:text-accent">
              <Avatar className="h-8 w-8"><AvatarImage src={ev.organizer?.avatar_url ?? undefined} /><AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials(ev.organizer?.full_name)}</AvatarFallback></Avatar>
              <span className="font-semibold">{ev.organizer?.full_name}</span>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="font-display font-semibold">Registered participants ({registrants.length})</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {registrants.length === 0 && <p className="text-sm text-muted-foreground">No registrations yet — be first!</p>}
          {registrants.map((r) => (
            <Link to={`/u/${r.profiles.username}`} key={r.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
              <Avatar><AvatarImage src={r.profiles.avatar_url ?? undefined} /><AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials(r.profiles.full_name)}</AvatarFallback></Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate">{r.profiles.full_name}</p>
                <p className="text-xs text-muted-foreground">@{r.profiles.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}
