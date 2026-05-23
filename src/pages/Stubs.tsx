import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { MessageSquare, Bell } from "lucide-react";

export function Messages() {
  return (
    <AppLayout>
      <Card className="p-12 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-accent" />
        <h1 className="font-display font-bold text-2xl mt-4">Messaging is coming soon</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">Real-time chat between athletes, coaches, and organizers is being polished — it'll land in the next update.</p>
      </Card>
    </AppLayout>
  );
}

export function Notifications() {
  return (
    <AppLayout>
      <Card className="p-12 text-center">
        <Bell className="h-12 w-12 mx-auto text-accent" />
        <h1 className="font-display font-bold text-2xl mt-4">Notifications are coming soon</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">You'll see follower, comment, like, team invite, and event registration notifications here.</p>
      </Card>
    </AppLayout>
  );
}
