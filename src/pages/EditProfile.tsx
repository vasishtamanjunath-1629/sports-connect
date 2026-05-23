import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { initials, uploadFile } from "@/lib/uploads";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

export default function EditProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => { if (profile) { setForm(profile); setSkillsInput((profile.skills ?? []).join(", ")); } }, [profile]);

  if (!form) return <AppLayout><Card className="p-8 text-center text-muted-foreground">Loading…</Card></AppLayout>;

  const upload = async (bucket: "avatars" | "covers", file: File) => {
    if (!user) return;
    try {
      const url = await uploadFile(bucket, user.id, file);
      const field = bucket === "avatars" ? "avatar_url" : "cover_url";
      setForm((f: any) => ({ ...f, [field]: url }));
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, username: form.username, bio: form.bio, sport: form.sport,
      location: form.location, website: form.website, achievements: form.achievements,
      avatar_url: form.avatar_url, cover_url: form.cover_url, skills,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    await refreshProfile();
    toast({ title: "Profile updated" });
    nav(`/u/${form.username}`);
  };

  return (
    <AppLayout>
      <Card className="overflow-hidden">
        <div className="relative h-44 bg-gradient-hero">
          {form.cover_url && <img src={form.cover_url} alt="" className="w-full h-full object-cover" />}
          <label className="absolute top-3 right-3 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload("covers", e.target.files[0])} />
            <span className="inline-flex items-center gap-1 bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-card"><Camera className="h-4 w-4" /> Cover</span>
          </label>
        </div>
        <div className="px-6 pb-6 -mt-14 relative">
          <div className="relative w-fit">
            <Avatar className="h-28 w-28 ring-4 ring-card">
              <AvatarImage src={form.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials(form.full_name)}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-1 right-1 cursor-pointer bg-accent text-accent-foreground rounded-full p-2 shadow-glow">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload("avatars", e.target.files[0])} />
              <Camera className="h-4 w-4" />
            </label>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Username</Label><Input value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label>Sport</Label><Input value={form.sport ?? ""} onChange={(e) => setForm({ ...form, sport: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lagos, Nigeria" /></div>
            <div className="sm:col-span-2"><Label>Website</Label><Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" /></div>
            <div className="sm:col-span-2"><Label>Bio</Label><Textarea rows={3} value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the world about yourself" /></div>
            <div className="sm:col-span-2"><Label>Skills (comma-separated)</Label><Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Sprinting, Endurance, Strategy" /></div>
            <div className="sm:col-span-2"><Label>Achievements</Label><Textarea rows={4} value={form.achievements ?? ""} onChange={(e) => setForm({ ...form, achievements: e.target.value })} placeholder="Medals, records, recognitions…" /></div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => nav(-1)}>Cancel</Button>
            <Button variant="accent" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</Button>
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
