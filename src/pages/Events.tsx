import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/uploads";
import { Plus, CalendarDays, MapPin, Search } from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", sport: "", city: "", venue: "", starts_at: "" });
  const [poster, setPoster] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
    setEvents(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!user || !form.title || !form.sport || !form.starts_at) return;
    setCreating(true);
    try {
      let poster_url: string | null = null;
      if (poster) poster_url = await uploadFile("events", user.id, poster);
      const { error } = await supabase.from("events").insert({ ...form, starts_at: new Date(form.starts_at).toISOString(), poster_url, organizer_id: user.id });
      if (error) throw error;
      setOpen(false); setForm({ title: "", description: "", sport: "", city: "", venue: "", starts_at: "" }); setPoster(null);
      toast({ title: "Event created!" }); load();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const filtered = events.filter((e) => !q || `${e.title} ${e.sport} ${e.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display font-bold text-2xl">Events</h1>
          <p className="text-muted-foreground text-sm">Tournaments, trials, camps. Register in one tap.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="accent"><Plus className="h-4 w-4" /> Create event</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create an event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sport</Label><Input value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} /></div>
                <div><Label>Date & time</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div><Label>Poster</Label><Input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] ?? null)} /></div>
              <Button onClick={create} variant="accent" className="w-full" disabled={creating || !form.title || !form.sport || !form.starts_at}>Create event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.length === 0 && <Card className="p-8 text-center col-span-full text-muted-foreground">No events scheduled.</Card>}
        {filtered.map((e) => (
          <Link to={`/events/${e.id}`} key={e.id}>
            <Card className="overflow-hidden hover:shadow-md hover:border-accent/40 transition-all h-full">
              <div className="aspect-[16/9] bg-gradient-hero relative">
                {e.poster_url && <img src={e.poster_url} alt="" className="w-full h-full object-cover" />}
                <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0">{e.sport}</Badge>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold leading-tight line-clamp-2">{e.title}</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{format(new Date(e.starts_at), "MMM d, p")}</span>
                  {e.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.city}</span>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
