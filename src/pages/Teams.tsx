import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trophy, Search } from "lucide-react";
import { uploadFile } from "@/lib/uploads";

export default function Teams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [sport, setSport] = useState(""); const [city, setCity] = useState("");
  const [desc, setDesc] = useState(""); const [logo, setLogo] = useState<File | null>(null); const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("teams").select("id, name, sport, description, logo_url, city, captain_id").order("created_at", { ascending: false });
    setTeams(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!user || !name.trim() || !sport.trim()) return;
    setCreating(true);
    try {
      let logo_url: string | null = null;
      if (logo) logo_url = await uploadFile("teams", user.id, logo);
      const { error } = await supabase.from("teams").insert({ name, sport, city, description: desc, logo_url, captain_id: user.id });
      if (error) throw error;
      setOpen(false); setName(""); setSport(""); setCity(""); setDesc(""); setLogo(null);
      toast({ title: "Team created!" }); load();
    } catch (e: any) { toast({ title: "Create failed", description: e.message, variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const filtered = teams.filter((t) => !q || `${t.name} ${t.sport} ${t.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display font-bold text-2xl">Teams</h1>
          <p className="text-muted-foreground text-sm">Find squads. Build yours.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="accent"><Plus className="h-4 w-4" /> New team</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a team</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Team name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sport</Label><Input value={sport} onChange={(e) => setSport(e.target.value)} /></div>
                <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
              <div><Label>Logo</Label><Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} /></div>
              <Button onClick={create} variant="accent" className="w-full" disabled={creating || !name || !sport}>Create team</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search teams" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.length === 0 && <Card className="p-8 text-center col-span-full text-muted-foreground">No teams yet — be the first to create one.</Card>}
        {filtered.map((t) => (
          <Link to={`/teams/${t.id}`} key={t.id}>
            <Card className="p-5 h-full hover:shadow-md hover:border-accent/40 transition-all">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 rounded-xl">
                  <AvatarImage src={t.logo_url ?? undefined} />
                  <AvatarFallback className="rounded-xl bg-gradient-accent text-accent-foreground"><Trophy className="h-6 w-6" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate">{t.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge className="bg-accent/10 text-accent border-0">{t.sport}</Badge>
                    {t.city && <Badge variant="secondary">{t.city}</Badge>}
                  </div>
                  {t.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
