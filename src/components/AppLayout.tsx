import { ReactNode } from "react";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";

export default function AppLayout({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <TopNav />
      <div className="container max-w-[1280px] pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-20"><LeftSidebar /></div>
          </aside>
          <main className="min-w-0">{children}</main>
          <aside className="hidden lg:block">
            <div className="sticky top-20">{right}</div>
          </aside>
        </div>
      </div>
    </div>
  );
}
