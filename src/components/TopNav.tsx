import { Link, useNavigate } from "react-router-dom";
import { Bell, Home, MessageSquare, Search, Trophy, Users, CalendarDays, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/uploads";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";

export default function TopNav() {
  const { profile, signOut, user } = useAuth();
  const nav = useNavigate();

  const handleSignOut = async () => { await signOut(); nav("/"); };

  const links = [
    { to: "/feed", label: "Feed", icon: Home },
    { to: "/network", label: "Network", icon: Users },
    { to: "/teams", label: "Teams", icon: Trophy },
    { to: "/events", label: "Events", icon: CalendarDays },
    { to: "/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 bg-card/90 backdrop-blur-xl border-b border-border">
      <div className="container max-w-[1280px] h-full flex items-center gap-4">
        <Link to={user ? "/feed" : "/"} className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-accent grid place-items-center shadow-glow">
            <Trophy className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:block">COMPIT</span>
        </Link>

        <div className="relative flex-1 max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search athletes, teams, events" className="pl-9 bg-muted/60 border-0 focus-visible:ring-2 focus-visible:ring-accent" />
        </div>

        {user && (
          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-accent"
              >
                <l.icon className="h-5 w-5" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/notifications" aria-label="Notifications"><Bell className="h-5 w-5" /></Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-accent">
                    <Avatar className="h-9 w-9 ring-2 ring-border">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-semibold">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/u/${profile?.username}`}><UserIcon className="h-4 w-4 mr-2" />My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit">Edit Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="accent" asChild><Link to="/auth?mode=signup">Join COMPIT</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
