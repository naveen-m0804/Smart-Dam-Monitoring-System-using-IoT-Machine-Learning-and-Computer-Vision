import { ReactNode } from "react";
import { DamSidebar } from "./DamSidebar";
import { DamTopBar } from "./DamTopBar";

interface DamLayoutProps {
  children: ReactNode;
}

export function DamLayout({ children }: DamLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DamSidebar />
      <div className="ml-64">
        <DamTopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
