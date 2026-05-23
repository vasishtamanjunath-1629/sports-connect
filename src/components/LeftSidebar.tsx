import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import { MapPin, Trophy } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  athlete: "Athlete", coach: "Coach", organizer: "Organizer", team_manager: "Team Manager",
};

export default function LeftSidebar() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <Card className="overflow-hidden bg-gradient-card border-border/60 shadow-sm">
      <Link to={`/u/${profile.username}`} className="block group">
        <div className="h-20 bg-gradient-hero relative">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="px-4 pb-4 -mt-8">
          <Avatar className="h-16 w-16 ring-4 ring-card">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-2 font-display font-semibold leading-tight group-hover:text-accent transition-colors">
            {profile.full_name}
          </h3>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="font-medium">{ROLE_LABEL[profile.role]}</Badge>
            {profile.sport && <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-0">{profile.sport}</Badge>}
          </div>
          {profile.location && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {profile.location}
            </p>
          )}
        </div>
      </Link>
      <div className="border-t border-border px-4 py-3 text-sm">
        <Link to="/dashboard" className="flex items-center justify-between hover:text-accent transition-colors">
          <span className="text-muted-foreground">Dashboard</span>
          <Trophy className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
