import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell, type Tab } from "@/components/church/AppShell";
import { Dashboard } from "@/components/church/Dashboard";
import { Schedules } from "@/components/church/Schedules";
import { Agenda } from "@/components/church/Agenda";
import { Notices } from "@/components/church/Notices";
import { Bible } from "@/components/church/Bible";
import { Prayers } from "@/components/church/Prayers";
import { People } from "@/components/church/People";
import { Members } from "@/components/church/Members";
import { Auth } from "@/components/church/Auth";
import { useStore, loadSession, refreshSharedState } from "@/lib/church-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hub Koinonia SJC — Gestão da Igreja" },
      {
        name: "description",
        content: "Gestão interna da igreja: escalas, agenda de eventos, avisos e dashboard.",
      },
      { property: "og:title", content: "Hub Koinonia SJC" },
      {
        property: "og:description",
        content: "Gestão interna da igreja: escalas, agenda de eventos, avisos e dashboard.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [ready, setReady] = useState(false);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const me = users.find((u) => u.id === currentUserId);

  // sessão real do backend
  useEffect(() => {
    loadSession().finally(() => setReady(true));
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadSession();
      }
    });
    const refresh = window.setInterval(() => {
      refreshSharedState().catch(() => {});
    }, 10000);
    return () => {
      window.clearInterval(refresh);
      data.subscription.unsubscribe();
    };
  }, []);

  // se membro tenta acessar aba de admin, redireciona
  useEffect(() => {
    if (me && me.role !== "admin" && (tab === "members" || tab === "people")) setTab("dashboard");
  }, [me, tab]);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

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
        {tab === "bible" && <Bible />}
        {tab === "prayers" && <Prayers />}
        {tab === "people" && me.role === "admin" && <People />}
        {tab === "members" && me.role === "admin" && <Members />}
      </AppShell>
      <Toaster position="top-right" richColors />
    </>
  );
}
