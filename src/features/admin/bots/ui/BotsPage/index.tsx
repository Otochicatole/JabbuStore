import React from "react";
import { AdminBotsPanel } from "../AdminBotsPanel";
import { AdminSection } from "@/features/admin/ui/AdminShell";

export function BotsPage() {
  return (
    <AdminSection>
      <AdminBotsPanel />
    </AdminSection>
  );
}
