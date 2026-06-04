import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell, type Tab } from "@/components/church/AppShell";
import { Dashboard } from "@/components/church/Dashboard";
import { Schedules } from "@/components/church/Schedules";
import { Agenda } from "@/components/church/Agenda";
import { Notices } from "@/components/church/Notices";
import { Members } from "@/components/church/Members";
import { Auth } from "@/components/church/Auth";
import { useStore } from "@/lib/church-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hub Koinonia SJC — Gestão da Igreja" },
      { name: "description", content: "Gestão interna da igreja: escalas, agenda de eventos, avisos e dashboard." },
      { property: "og:title", content: "Hub Koinonia SJC" },
      { property: "og:description", content: "Gestão interna da igreja: escalas, agenda de eventos, avisos e dashboard." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const me = users.find((u) => u.id === currentUserId);

  // se membro tenta acessar aba de admin, redireciona
  useEffect(() => {
    if (me && me.role !== "admin" && tab === "members") setTab("dashboard");
  }, [me, tab]);

  if (!me) {
    return (
      <>
        <Auth />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <>
      <AppShell tab={tab} setTab={setTab}>
        {tab === "dashboard" && <Dashboard goTo={setTab} />}
        {tab === "schedules" && <Schedules />}
        {tab === "agenda" && <Agenda />}
        {tab === "notices" && <Notices />}
        {tab === "members" && me.role === "admin" && <Members />}
      </AppShell>
      <Toaster position="top-right" richColors />
    </>
  );
}
