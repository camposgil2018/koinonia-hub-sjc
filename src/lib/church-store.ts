import { useSyncExternalStore } from "react";

export type Role = "admin" | "member";
export type User = { id: string; name: string; role: Role; ministries: string[]; avatarColor: string };
export type Unavailability = { id: string; userId: string; start: string; end: string; reason?: string };
export type ScheduleAssignment = { ministry: string; role: string; userId: string };
export type Schedule = { id: string; date: string; time: string; title: string; assignments: ScheduleAssignment[] };
export type ChurchEvent = { id: string; date: string; time: string; title: string; location: string; description: string; category: string };
export type Notice = { id: string; title: string; category: string; content: string; date: string; author: string; pinned: boolean };

const MINISTRIES = ["Louvor", "Mídia", "Infantil", "Recepção", "Intercessão"] as const;
const NOTICE_CATEGORIES = ["Geral", "Jovens", "Casais", "Liderança"] as const;
const EVENT_CATEGORIES = ["Culto", "Reunião", "Pequeno Grupo", "Conferência", "Ensaio"] as const;

export const CATALOG = { MINISTRIES, NOTICE_CATEGORIES, EVENT_CATEGORIES };

const colors = ["#1e3a8a", "#0f766e", "#9a3412", "#7c3aed", "#b45309", "#0369a1", "#be123c", "#15803d"];
const pick = (i: number) => colors[i % colors.length];

const seedUsers: User[] = [
  { id: "u1", name: "Pr. André Lima", role: "admin", ministries: ["Liderança"], avatarColor: pick(0) },
  { id: "u2", name: "Mariana Costa", role: "admin", ministries: ["Louvor", "Mídia"], avatarColor: pick(1) },
  { id: "u3", name: "João Pereira", role: "member", ministries: ["Louvor"], avatarColor: pick(2) },
  { id: "u4", name: "Beatriz Souza", role: "member", ministries: ["Infantil"], avatarColor: pick(3) },
  { id: "u5", name: "Rafael Mendes", role: "member", ministries: ["Mídia"], avatarColor: pick(4) },
  { id: "u6", name: "Carla Ribeiro", role: "member", ministries: ["Recepção"], avatarColor: pick(5) },
  { id: "u7", name: "Lucas Almeida", role: "member", ministries: ["Louvor", "Intercessão"], avatarColor: pick(6) },
  { id: "u8", name: "Patrícia Nunes", role: "member", ministries: ["Recepção", "Infantil"], avatarColor: pick(7) },
];

const today = new Date();
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const iso = (d: Date) => d.toISOString().slice(0, 10);

const nextSunday = (() => {
  const d = new Date(today);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d;
})();

const seedSchedules: Schedule[] = [
  {
    id: "s1", date: iso(nextSunday), time: "18:00", title: "Culto da Família",
    assignments: [
      { ministry: "Louvor", role: "Vocal Principal", userId: "u2" },
      { ministry: "Louvor", role: "Violão", userId: "u3" },
      { ministry: "Louvor", role: "Backing", userId: "u7" },
      { ministry: "Mídia", role: "Projeção", userId: "u5" },
      { ministry: "Infantil", role: "Professor", userId: "u4" },
      { ministry: "Recepção", role: "Boas-vindas", userId: "u6" },
    ],
  },
  {
    id: "s2", date: iso(addDays(nextSunday, 7)), time: "18:00", title: "Culto da Família",
    assignments: [
      { ministry: "Louvor", role: "Vocal Principal", userId: "u7" },
      { ministry: "Louvor", role: "Violão", userId: "u3" },
      { ministry: "Mídia", role: "Som", userId: "u5" },
      { ministry: "Recepção", role: "Boas-vindas", userId: "u8" },
    ],
  },
  {
    id: "s3", date: iso(addDays(today, 3)), time: "20:00", title: "Reunião de Oração",
    assignments: [
      { ministry: "Intercessão", role: "Líder", userId: "u7" },
      { ministry: "Mídia", role: "Som", userId: "u5" },
    ],
  },
];

const seedEvents: ChurchEvent[] = [
  { id: "e1", date: iso(nextSunday), time: "18:00", title: "Culto da Família", location: "Templo Principal", description: "Culto semanal com louvor, palavra e ministração.", category: "Culto" },
  { id: "e2", date: iso(addDays(today, 3)), time: "20:00", title: "Reunião de Oração", location: "Sala 2", description: "Encontro semanal de intercessão.", category: "Reunião" },
  { id: "e3", date: iso(addDays(today, 5)), time: "19:30", title: "Ensaio do Louvor", location: "Auditório", description: "Ensaio para o culto de domingo.", category: "Ensaio" },
  { id: "e4", date: iso(addDays(today, 10)), time: "19:00", title: "Pequeno Grupo - Zona Sul", location: "Casa da Família Costa", description: "Comunhão e estudo bíblico.", category: "Pequeno Grupo" },
  { id: "e5", date: iso(addDays(today, 14)), time: "09:00", title: "Conferência de Jovens", location: "Templo Principal", description: "Dia inteiro com palestras e louvor.", category: "Conferência" },
  { id: "e6", date: iso(addDays(today, 21)), time: "18:00", title: "Culto da Família", location: "Templo Principal", description: "Culto semanal.", category: "Culto" },
];

const seedNotices: Notice[] = [
  { id: "n1", title: "Campanha de Doação de Alimentos", category: "Geral", content: "Estamos arrecadando alimentos não-perecíveis até o fim do mês. Deixe sua contribuição na recepção.", date: iso(addDays(today, -1)), author: "Pr. André Lima", pinned: true },
  { id: "n2", title: "Reunião de Líderes - Sábado 09h", category: "Liderança", content: "Todos os líderes de ministério devem comparecer.", date: iso(addDays(today, -2)), author: "Pr. André Lima", pinned: false },
  { id: "n3", title: "Inscrições Acampa Jovem", category: "Jovens", content: "Inscrições abertas até dia 20. Vagas limitadas!", date: iso(addDays(today, -4)), author: "Mariana Costa", pinned: false },
  { id: "n4", title: "Encontro de Casais", category: "Casais", content: "Jantar romântico com palestra. Reserve sua mesa.", date: iso(addDays(today, -7)), author: "Mariana Costa", pinned: false },
];

const seedUnav: Unavailability[] = [
  { id: "x1", userId: "u3", start: iso(addDays(today, 6)), end: iso(addDays(today, 9)), reason: "Viagem a trabalho" },
];

type State = {
  currentUserId: string;
  users: User[];
  schedules: Schedule[];
  events: ChurchEvent[];
  notices: Notice[];
  unavailability: Unavailability[];
};

const KEY = "koinonia-state-v1";

const initial: State = {
  currentUserId: "u3",
  users: seedUsers,
  schedules: seedSchedules,
  events: seedEvents,
  notices: seedNotices,
  unavailability: seedUnav,
};

const load = (): State => {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch { return initial; }
};

let state: State = load();
const listeners = new Set<() => void>();
const save = () => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};

export const store = {
  get: () => state,
  set: (updater: (s: State) => State) => { state = updater(state); save(); },
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  reset: () => { state = initial; save(); },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => selector(state),
    () => selector(initial),
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const isUserUnavailable = (userId: string, date: string, unav: Unavailability[]) =>
  unav.some((u) => u.userId === userId && date >= u.start && date <= u.end);
