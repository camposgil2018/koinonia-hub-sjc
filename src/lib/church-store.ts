import { useSyncExternalStore } from "react";
import { fetchState, upsertState } from "./app-state";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "moderator" | "member";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  ministries: string[];
  avatarColor: string;
  phone?: string;
};
export type Unavailability = {
  id: string;
  userId: string;
  start: string;
  end: string;
  reason?: string;
};
export type ScheduleAssignment = {
  ministry: string;
  role: string;
  userId: string;
  status?: "pending" | "confirmed" | "declined";
};
export type Schedule = {
  id: string;
  date: string;
  time: string;
  title: string;
  assignments: ScheduleAssignment[];
};
export type ChurchEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  location: string;
  description: string;
  category: string;
};
export type Notice = {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  author: string;
  pinned: boolean;
};
export type AppNotification = {
  id: string;
  userId: string;
  type: "schedule" | "notice" | "media";
  title: string;
  body: string;
  link: "schedules" | "notices" | "media";
  refId: string;
  date: string;
  read: boolean;
};
export type MediaRequestStatus = "pending" | "in_progress" | "completed" | "cancelled" | "rejected";
export type MediaRequestPriority = "low" | "medium" | "high" | "urgent";
export type MediaRequest = {
  id: string;
  title: string;
  requesterId: string;
  requesterName: string;
  department: string;
  type: string;
  description: string;
  reference?: string;
  dueDate: string;
  priority: MediaRequestPriority;
  status: MediaRequestStatus;
  rejectionReason?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
};
export type MediaMessage = {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  text: string;
  date: string;
};
export type ContactType = "congregado" | "visitante";
export type Contact = {
  id: string;
  name: string;
  type: ContactType;
  phone?: string;
  email?: string;
  birthDate?: string;
  address?: string;
  firstVisit: string;
  invitedBy?: string;
  followedUp: boolean;
  notes?: string;
};
export type Devotional = {
  id: string;
  title: string;
  verseRef?: string;
  verseText?: string;
  content: string;
  authorId: string | null;
  authorName: string;
  date: string;
};
export type PrayerStatus = "novo" | "orando" | "respondido";
export type PrayerRequest = {
  id: string;
  authorId: string | null;
  authorName: string;
  title: string;
  content: string;
  status: PrayerStatus;
  isPrivate: boolean;
  date: string;
  prayedBy: string[];
};




const MINISTRIES = ["Louvor", "Mídia", "Infantil", "Staff", "Intercessão"] as const;
const NOTICE_CATEGORIES = ["Geral", "Jovens", "Casais", "Liderança"] as const;
const EVENT_CATEGORIES = ["Culto", "Sala de Oração", "Projeto Social", "GC"] as const;

export const CATALOG = { MINISTRIES, NOTICE_CATEGORIES, EVENT_CATEGORIES };

const colors = [
  "#1e3a8a",
  "#0f766e",
  "#9a3412",
  "#7c3aed",
  "#b45309",
  "#0369a1",
  "#be123c",
  "#15803d",
];
export const pickColor = (i: number) => colors[i % colors.length];

const seedUsers: User[] = [
  {
    id: "u-gilmar",
    name: "Gilmar Campos",
    email: "gilmar@koinonia.com",
    role: "admin",
    ministries: ["Liderança"],
    avatarColor: pickColor(0),
  },
  {
    id: "u2",
    name: "Mariana Costa",
    email: "mariana@koinonia.com",
    role: "admin",
    ministries: ["Louvor", "Mídia"],
    avatarColor: pickColor(1),
  },
  {
    id: "u3",
    name: "João Pereira",
    email: "joao@koinonia.com",
    role: "member",
    ministries: ["Louvor"],
    avatarColor: pickColor(2),
  },
  {
    id: "u4",
    name: "Beatriz Souza",
    email: "bia@koinonia.com",
    role: "member",
    ministries: ["Infantil"],
    avatarColor: pickColor(3),
  },
  {
    id: "u5",
    name: "Rafael Mendes",
    email: "rafael@koinonia.com",
    role: "member",
    ministries: ["Mídia"],
    avatarColor: pickColor(4),
  },
  {
    id: "u6",
    name: "Carla Ribeiro",
    email: "carla@koinonia.com",
    role: "member",
    ministries: ["Staff"],
    avatarColor: pickColor(5),
  },
  {
    id: "u7",
    name: "Lucas Almeida",
    email: "lucas@koinonia.com",
    role: "member",
    ministries: ["Louvor", "Intercessão"],
    avatarColor: pickColor(6),
  },
  {
    id: "u8",
    name: "Patrícia Nunes",
    email: "patricia@koinonia.com",
    role: "member",
    ministries: ["Staff", "Infantil"],
    avatarColor: pickColor(7),
  },
];

const today = new Date();
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);

const nextSunday = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d;
})();

const seedSchedules: Schedule[] = [
  {
    id: "s1",
    date: iso(nextSunday),
    time: "18:00",
    title: "Culto da Família",
    assignments: [
      { ministry: "Louvor", role: "Vocal Principal", userId: "u2" },
      { ministry: "Louvor", role: "Violão", userId: "u3" },
      { ministry: "Louvor", role: "Backing", userId: "u7" },
      { ministry: "Mídia", role: "Projeção", userId: "u5" },
      { ministry: "Infantil", role: "Professor", userId: "u4" },
      { ministry: "Staff", role: "Boas-vindas", userId: "u6" },
    ],
  },
  {
    id: "s2",
    date: iso(addDays(nextSunday, 7)),
    time: "18:00",
    title: "Culto da Família",
    assignments: [
      { ministry: "Louvor", role: "Vocal Principal", userId: "u7" },
      { ministry: "Louvor", role: "Violão", userId: "u3" },
      { ministry: "Mídia", role: "Som", userId: "u5" },
      { ministry: "Staff", role: "Boas-vindas", userId: "u8" },
    ],
  },
  {
    id: "s3",
    date: iso(addDays(today, 3)),
    time: "20:00",
    title: "Reunião de Oração",
    assignments: [
      { ministry: "Intercessão", role: "Líder", userId: "u7" },
      { ministry: "Mídia", role: "Som", userId: "u5" },
    ],
  },
];

const AGENDA_VERSION = 2;

const buildAgendaEvents = (): ChurchEvent[] => {
  const events: ChurchEvent[] = [];
  const start = new Date(Date.UTC(2026, 7, 25));
  const end = new Date(Date.UTC(2027, 11, 31));
  const cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= end) {
    const date = iso(cursor);
    const weekday = cursor.getUTCDay();

    if (weekday === 2 && dayIndex % 14 === 0) {
      events.push({
        id: `agenda-sala-oracao-${date}`,
        date,
        time: "20:00",
        title: "Sala de Oração",
        location: "Igreja Koinonia SJC",
        description: "Encontro de oração da igreja.",
        category: "Sala de Oração",
      });
    }
    if (weekday === 3) {
      events.push({
        id: `agenda-projeto-social-${date}`,
        date,
        time: "20:00",
        title: "Projeto Social (Jiu Jitsu)",
        location: "Igreja Koinonia SJC",
        description: "Projeto social de Jiu Jitsu.",
        category: "Projeto Social",
      });
    }
    if (weekday === 4) {
      events.push({
        id: `agenda-gc-${date}`,
        date,
        time: "20:00",
        title: "GC - Grupos de Comunhão",
        location: "Casas",
        description: "Grupos de comunhão nas casas.",
        category: "GC",
      });
    }
    if (weekday === 0) {
      events.push({
        id: `agenda-culto-celebracao-${date}`,
        date,
        time: "19:00",
        title: "Culto de Celebração",
        location: "Igreja Koinonia SJC",
        description: "Culto semanal de celebração.",
        category: "Culto",
      });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
    dayIndex += 1;
  }

  return events;
};

const seedEvents: ChurchEvent[] = buildAgendaEvents();

const seedNotices: Notice[] = [
  {
    id: "n1",
    title: "Campanha de Doação de Alimentos",
    category: "Geral",
    content:
      "Estamos arrecadando alimentos não-perecíveis até o fim do mês. Deixe sua contribuição na recepção.",
    date: iso(addDays(today, -1)),
    author: "Gilmar Campos",
    pinned: true,
  },
  {
    id: "n2",
    title: "Reunião de Líderes - Sábado 09h",
    category: "Liderança",
    content: "Todos os líderes de ministério devem comparecer.",
    date: iso(addDays(today, -2)),
    author: "Gilmar Campos",
    pinned: false,
  },
  {
    id: "n3",
    title: "Inscrições Acampa Jovem",
    category: "Jovens",
    content: "Inscrições abertas até dia 20. Vagas limitadas!",
    date: iso(addDays(today, -4)),
    author: "Mariana Costa",
    pinned: false,
  },
  {
    id: "n4",
    title: "Encontro de Casais",
    category: "Casais",
    content: "Jantar romântico com palestra. Reserve sua mesa.",
    date: iso(addDays(today, -7)),
    author: "Mariana Costa",
    pinned: false,
  },
];

const seedUnav: Unavailability[] = [
  {
    id: "x1",
    userId: "u3",
    start: iso(addDays(today, 6)),
    end: iso(addDays(today, 9)),
    reason: "Viagem a trabalho",
  },
];


const seedPrayers: PrayerRequest[] = [
  {
    id: "p1",
    authorId: "u4",
    authorName: "Beatriz Souza",
    title: "Saúde da minha mãe",
    content: "Peço oração pela recuperação da minha mãe, que está internada.",
    status: "orando",
    isPrivate: false,
    date: iso(addDays(today, -1)),
    prayedBy: ["u2", "u7"],
  },
  {
    id: "p2",
    authorId: "u3",
    authorName: "João Pereira",
    title: "Sabedoria nas decisões",
    content: "Estou passando por uma decisão importante de trabalho.",
    status: "novo",
    isPrivate: false,
    date: iso(addDays(today, -2)),
    prayedBy: [],
  },
  {
    id: "p3",
    authorId: "u6",
    authorName: "Carla Ribeiro",
    title: "Gratidão pela família",
    content: "Deus respondeu nossa oração pela restauração familiar. Glória a Deus!",
    status: "respondido",
    isPrivate: false,
    date: iso(addDays(today, -6)),
    prayedBy: ["u2", "u4", "u8"],
  },
];

const seedContacts: Contact[] = [
  {
    id: "c1",
    name: "Fernanda Lima",
    type: "visitante",
    phone: "(12) 99123-4567",
    email: "fernanda@email.com",
    firstVisit: iso(addDays(today, -3)),
    invitedBy: "Carla Ribeiro",
    followedUp: false,
    notes: "Primeira visita no culto da família.",
  },
  {
    id: "c2",
    name: "Marcos Antunes",
    type: "congregado",
    phone: "(12) 98888-1122",
    firstVisit: iso(addDays(today, -120)),
    followedUp: true,
    notes: "Frequenta há 4 meses, interesse no ministério de mídia.",
  },
  {
    id: "c3",
    name: "Juliana e Pedro Reis",
    type: "visitante",
    phone: "(12) 97777-3344",
    firstVisit: iso(addDays(today, -10)),
    invitedBy: "Mariana Costa",
    followedUp: true,
    notes: "Casal recém-chegado à cidade.",
  },
];

type State = {
  currentUserId: string | null;
  users: User[];
  removedUserIds: string[];
  schedules: Schedule[];
  events: ChurchEvent[];
  notices: Notice[];
  unavailability: Unavailability[];
  notifications: AppNotification[];
  mediaRequests: MediaRequest[];
  mediaMessages: MediaMessage[];
  prayers: PrayerRequest[];
  contacts: Contact[];
  devotionals: Devotional[];
  googleCalendarId?: string;
  googleApiKey?: string;
  syncGoogleCalendar?: boolean;
  eventCategories: string[];
  agendaVersion: number;
};

const KEY = "koinonia-state-v2";

const initial: State = {
  currentUserId: null,
  // O projeto antigo manterá somente a conta administrativa.
  users: [seedUsers[0]],
  removedUserIds: [],
  schedules: seedSchedules,
  events: seedEvents,
  notices: seedNotices,
  unavailability: seedUnav,
  notifications: [],
  mediaRequests: [],
  mediaMessages: [],
  prayers: seedPrayers,
  contacts: seedContacts,
  devotionals: [],
  googleCalendarId: "",
  googleApiKey: "",
  syncGoogleCalendar: false,
  eventCategories: [...EVENT_CATEGORIES],
  agendaVersion: AGENDA_VERSION,
};


const load = (): State => {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return {
      ...initial,
      ...parsed,
      events: parsed.agendaVersion === AGENDA_VERSION ? parsed.events : seedEvents,
      agendaVersion: AGENDA_VERSION,
      eventCategories: parsed.eventCategories ?? initial.eventCategories,
      notifications: parsed.notifications ?? [],
      mediaRequests: parsed.mediaRequests ?? [],
      mediaMessages: parsed.mediaMessages ?? [],
      prayers: parsed.prayers ?? initial.prayers,
      contacts: parsed.contacts ?? initial.contacts,
      devotionals: parsed.devotionals ?? initial.devotionals,
      removedUserIds: parsed.removedUserIds ?? [],
    };


  } catch {
    return initial;
  }
};

let state: State = load();
const listeners = new Set<() => void>();
const save = () => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  // Persistir no Supabase (não aguarda, falha será logada)
  upsertState(state).catch((e) => console.error('Supabase upsert error:', e));
  listeners.forEach((l) => l());
};

function diffNotify(prev: State, next: State) {
  const created: AppNotification[] = [];
  const now = new Date().toISOString();
  const actorId = next.currentUserId;

  const prevNoticeIds = new Set(prev.notices.map((n) => n.id));
  for (const n of next.notices) {
    if (prevNoticeIds.has(n.id)) continue;
    for (const u of next.users) {
      if (u.id === actorId) continue;
      created.push({
        id: uid(),
        userId: u.id,
        type: "notice",
        title: "Novo aviso: " + n.title,
        body: n.content.length > 140 ? n.content.slice(0, 140) + "…" : n.content,
        link: "notices",
        refId: n.id,
        date: now,
        read: false,
      });
    }
  }

  const prevSchedById = new Map(prev.schedules.map((s) => [s.id, s]));
  for (const s of next.schedules) {
    const old = prevSchedById.get(s.id);
    const oldUserIds = new Set(old ? old.assignments.map((a) => a.userId) : []);
    for (const a of s.assignments) {
      if (oldUserIds.has(a.userId)) continue;
      if (a.userId === actorId) continue;
      const d = new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
      created.push({
        id: uid(),
        userId: a.userId,
        type: "schedule",
        title: "Você foi escalado",
        body: `${s.title} • ${d} ${s.time} — ${a.ministry} (${a.role})`,
        link: "schedules",
        refId: s.id,
        date: now,
        read: false,
      });
    }
  }

  if (created.length) {
    state = { ...state, notifications: [...created, ...state.notifications].slice(0, 200) };
  }
}

export const store = {
  get: () => state,
  set: (updater: (s: State) => State, opts?: { silent?: boolean; persist?: boolean }) => {
    const prev = state;
    state = updater(prev);
    if (!opts?.silent) diffNotify(prev, state);
    if (opts?.persist !== false) save();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  reset: () => {
    state = initial;
    save();
  },
};

// Carrega apenas os dados compartilhados. Usuários e sessão nunca vêm do
// JSON legado, que no passado chegou a armazenar credenciais em texto aberto.
export async function refreshSharedState() {
  const remote = await fetchState();
  if (!remote) return;
  const { users: _u, currentUserId: _c, ...shared } = remote as Partial<State>;
  const needsAgendaMigration = shared.agendaVersion !== AGENDA_VERSION;
  store.set(
    (s) => ({
      ...s,
      ...shared,
      events: needsAgendaMigration ? seedEvents : shared.events ?? s.events,
      eventCategories: needsAgendaMigration ? [...EVENT_CATEGORIES] : shared.eventCategories ?? s.eventCategories,
      agendaVersion: AGENDA_VERSION,
    }),
    { silent: true, persist: needsAgendaMigration },
  );
}

if (typeof window !== "undefined") {
  supabase.auth
    .getSession()
    .then(({ data }) => {
      if (data.session) return refreshSharedState();
    })
    .catch((e) => console.warn("Backend fetch error:", e));
}


export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => selector(state),
    () => selector(initial),
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const isUserUnavailable = (userId: string, date: string, unav: Unavailability[]) =>
  unav.some((u) => u.userId === userId && date >= u.start && date <= u.end);

export const notifications = {
  markRead: (id: string) =>
    store.set(
      (s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }),
      { silent: true },
    ),
  markAllRead: (userId: string) =>
    store.set(
      (s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.userId === userId ? { ...n, read: true } : n,
        ),
      }),
      { silent: true },
    ),
  clear: (userId: string) =>
    store.set(
      (s) => ({ ...s, notifications: s.notifications.filter((n) => n.userId !== userId) }),
      { silent: true },
    ),
};


// ---------- AUTH (autenticação real no backend) ----------
type Result = { ok: true } | { ok: false; error: string };

const translate = (msg: string) => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "E-mail já cadastrado";
  if (m.includes("password should be")) return "A senha deve ter no mínimo 6 caracteres";
  return msg;
};

export const auth = {
  login: async (email: string, password: string): Promise<Result> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: translate(error.message) };
    await loadSession();
    return { ok: true };
  },
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    ministries?: string[];
  }): Promise<{ ok: true; needsConfirmation: boolean } | { ok: false; error: string }> => {
    const e = data.email.trim().toLowerCase();
    if (!data.name.trim() || !e || !data.password)
      return { ok: false, error: "Preencha todos os campos" };
    if (data.password.length < 6)
      return { ok: false, error: "A senha deve ter no mínimo 6 caracteres" };
    const { data: res, error } = await supabase.auth.signUp({
      email: e,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: data.name.trim(),
          phone: data.phone ?? "",
          ministries: data.ministries ?? [],
          avatar_color: pickColor(state.users.length),
        },
      },
    });
    if (error) return { ok: false, error: translate(error.message) };
    if (res.session) await loadSession();
    return { ok: true, needsConfirmation: !res.session };
  },
  logout: async () => {
    await supabase.auth.signOut();
    store.set((s) => ({ ...s, currentUserId: null }), { silent: true });
  },
  requestPasswordReset: async (email: string): Promise<Result> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, error: translate(error.message) };
    return { ok: true };
  },
  changePassword: async (newPassword: string): Promise<Result> => {
    if (newPassword.length < 6)
      return { ok: false, error: "A nova senha deve ter no mínimo 6 caracteres" };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: translate(error.message) };
    return { ok: true };
  },
};

// ---------- MEMBROS (perfis + papéis no banco) ----------
type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  ministries: string[];
  avatar_color: string;
};

export async function loadUsersFromDb() {
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id,name,email,phone,ministries,avatar_color"),
    supabase.from("user_roles").select("user_id,role"),
  ]);
  if (!profiles) return;
  const roleById = new Map<string, Role>();
  for (const r of roles ?? []) {
    const current = roleById.get(r.user_id);
    if (current === "admin") continue;
    roleById.set(r.user_id, r.role as Role);
  }
  const removedUserIds = new Set(state.removedUserIds ?? []);
  const dbUsers: User[] = (profiles as ProfileRow[])
    .filter((profile) => !removedUserIds.has(profile.id))
    .map((p, i) => ({
      id: p.id,
      name: p.name || p.email,
      email: p.email,
      role: roleById.get(p.id) ?? "member",
      ministries: p.ministries ?? [],
      avatarColor: p.avatar_color || pickColor(i),
      phone: p.phone ?? undefined,
    }));
  const dbIds = new Set(dbUsers.map((u) => u.id));
  // preserva usuários herdados (sem conta) para não quebrar escalas antigas
  const legacy = state.users.filter(
    (u) => !dbIds.has(u.id) && !u.id.includes("-4") && !removedUserIds.has(u.id),
  );
  store.set((s) => ({ ...s, users: [...dbUsers, ...legacy] }), { silent: true });
}

export const members = {
  setRole: async (userId: string, role: Role): Promise<Result> => {
    const del = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (del.error) return { ok: false, error: del.error.message };
    const ins = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (ins.error) return { ok: false, error: ins.error.message };
    await loadUsersFromDb();
    return { ok: true };
  },
  updateProfile: async (
    userId: string,
    patch: { name?: string; phone?: string; ministries?: string[] },
  ): Promise<Result> => {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.ministries !== undefined ? { ministries: patch.ministries } : {}),
      })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    await loadUsersFromDb();
    return { ok: true };
  },
  remove: async (userId: string): Promise<Result> => {
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { code?: string; message: string } | null }>;
    const { error } = await rpc("delete_member", { target_user_id: userId });
    if (error) {
      const functionUnavailable =
        error.code === "PGRST202" || error.message.includes("schema cache");
      if (!functionUnavailable) return { ok: false, error: error.message };

      // Compatibilidade enquanto a migration ainda não foi aplicada no Supabase:
      // revoga primeiro o papel para impedir novo acesso e remove o perfil da igreja.
      await Promise.all([
        supabase.from("user_roles").delete().eq("user_id", userId),
        supabase.from("profiles").delete().eq("id", userId),
      ]);
    }
    store.set((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== userId),
      removedUserIds: [...new Set([...(s.removedUserIds ?? []), userId])],
      schedules: s.schedules.map((sc) => ({
        ...sc,
        assignments: sc.assignments.filter((a) => a.userId !== userId),
      })),
      unavailability: s.unavailability.filter((un) => un.userId !== userId),
    }));
    return { ok: true };
  },
};

// ---------- SESSÃO ----------
export async function loadSession() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    store.set((s) => ({ ...s, currentUserId: null }), { silent: true });
    return;
  }
  await refreshSharedState();
  await loadUsersFromDb();
  store.set(
    (s) => {
      // Compatibilidade com o banco legado: os usuários do estado antigo usam IDs
      // locais (por exemplo, "u-gilmar") em vez do UUID gerado pelo Supabase Auth.
      const matchedUser = s.users.find(
        (item) => item.email.trim().toLowerCase() === user.email?.trim().toLowerCase(),
      );
      return { ...s, currentUserId: matchedUser?.id ?? user.id };
    },
    { silent: true },
  );
}

// ---------- PEDIDOS DE ORAÇÃO ----------
export const prayers = {
  add: (data: { title: string; content: string; isPrivate: boolean }) => {
    const me = state.users.find((u) => u.id === state.currentUserId);
    const item: PrayerRequest = {
      id: uid(),
      authorId: me?.id ?? null,
      authorName: me?.name ?? "Anônimo",
      title: data.title.trim().slice(0, 120),
      content: data.content.trim().slice(0, 1000),
      status: "novo",
      isPrivate: data.isPrivate,
      date: new Date().toISOString().slice(0, 10),
      prayedBy: [],
    };
    store.set((s) => ({ ...s, prayers: [item, ...s.prayers] }), { silent: true });
  },
  update: (id: string, patch: Partial<PrayerRequest>) =>
    store.set(
      (s) => ({ ...s, prayers: s.prayers.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      { silent: true },
    ),
  remove: (id: string) =>
    store.set((s) => ({ ...s, prayers: s.prayers.filter((p) => p.id !== id) }), { silent: true }),
  togglePray: (id: string, userId: string) =>
    store.set(
      (s) => ({
        ...s,
        prayers: s.prayers.map((p) =>
          p.id === id
            ? {
                ...p,
                prayedBy: p.prayedBy.includes(userId)
                  ? p.prayedBy.filter((x) => x !== userId)
                  : [...p.prayedBy, userId],
              }
            : p,
        ),
      }),
      { silent: true },
    ),
};

// ---------- CONGREGADOS E VISITANTES ----------
export const contacts = {
  add: (data: Omit<Contact, "id">) =>
    store.set((s) => ({ ...s, contacts: [{ ...data, id: uid() }, ...s.contacts] }), {
      silent: true,
    }),
  update: (id: string, patch: Partial<Contact>) =>
    store.set(
      (s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
      { silent: true },
    ),
  remove: (id: string) =>
    store.set((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) }), { silent: true }),
};

// ---------- DEVOCIONAIS ----------
export const devotionals = {
  add: (data: { title: string; verseRef?: string; verseText?: string; content: string }) => {
    const me = state.users.find((u) => u.id === state.currentUserId);
    const item: Devotional = {
      id: uid(),
      title: data.title.trim().slice(0, 140),
      verseRef: data.verseRef?.trim() || undefined,
      verseText: data.verseText?.trim() || undefined,
      content: data.content.trim(),
      authorId: me?.id ?? null,
      authorName: me?.name ?? "Liderança",
      date: new Date().toISOString().slice(0, 10),
    };
    store.set((s) => ({ ...s, devotionals: [item, ...s.devotionals] }), { silent: true });
  },
  update: (id: string, patch: Partial<Devotional>) =>
    store.set(
      (s) => ({
        ...s,
        devotionals: s.devotionals.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      }),
      { silent: true },
    ),
  remove: (id: string) =>
    store.set((s) => ({ ...s, devotionals: s.devotionals.filter((d) => d.id !== id) }), {
      silent: true,
    }),
};
