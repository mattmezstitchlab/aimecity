export type Ambience = "day" | "sunset" | "night";

export type ProStatus =
  | "discovered"
  | "selected"
  | "to_contact"
  | "quote"
  | "confirmed"
  | "paid"
  | "done";

export interface Wedding {
  partnerA: string;
  partnerB: string;
  date: string;
  place: string;
  cityName: string;
  guests: number;
  budget: number;
  mood: string;
  note: string;
}

export interface CrewEntry {
  proId: string;
  status: ProStatus;
  fee: number;
  deposit: number;
  time: string;
  place: string;
  note: string;
}

export interface MissionState {
  done: boolean;
  date: string;
  note: string;
  planB: string;
  choice: string;
}

export interface DayEvent {
  id: string;
  title: string;
  start: string;
  duration: number;
  place: string;
  proId: string;
  icon: string;
  status: "prevu" | "confirme" | "en_cours" | "termine";
  planB: string;
}

export interface ClaimedCard {
  displayName: string;
  tagline: string;
  services: string;
  contact: string;
  phone: string;
  website: string;
  fee: number;
}

export interface RadioLink {
  stationId: string;
  url: string;
  moment: string;
  note: string;
}

export interface PhotoMemory {
  id: string;
  src: string;
  caption: string;
}

export interface AriaMessage {
  id: string;
  role: "aria" | "user";
  text: string;
  at: string;
}

export interface Reminder {
  id: string;
  text: string;
  due: string;
  createdAt: string;
}

export interface LocalRsvp {
  id: string;
  name: string;
  attending: boolean;
  count: number;
  song: string;
  message: string;
  at: string;
}

export interface MiniSiteSettings {
  style: "classic" | "city";
  headline: string;
  welcome: string;
  practical: string;
  dressCode: string;
  musicNote: string;
}

export interface StoryState {
  version: number;
  started: boolean;
  demo: boolean;
  wedding: Wedding;
  crew: CrewEntry[];
  missions: Record<string, MissionState>;
  events: DayEvent[];
  claims: Record<string, ClaimedCard>;
  radio: RadioLink[];
  photos: PhotoMemory[];
  miniSite: MiniSiteSettings;
  ambience: Ambience;
  aria: AriaMessage[];
  reminders: Reminder[];
  rsvps: LocalRsvp[];
  publishedCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  name: string;
  tagline: string;
  description: string;
  jobs: string[];
  color: string;
  art: string;
  x: number;
  y: number;
}

export interface Pro {
  id: string;
  name: string;
  job: string;
  districtId: string;
  skills: string[];
  services: string[];
  fee: number;
  duration: string;
  bio: string;
  signature: string;
  art: string;
  accent: string;
  fictional: boolean;
}

export interface JobEntry {
  id: string;
  label: string;
  districtId: string;
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  tone: string;
}

export interface Mission {
  id: string;
  chapterId: string;
  index: number;
  title: string;
  brief: string;
  action: string;
  districtId: string;
  revealProId: string;
  icon: string;
  reward: string;
  offsetDays: number;
}

export interface RadioStation {
  id: string;
  name: string;
  mood: string;
  moment: string;
  description: string;
  accents: string[];
  search: string;
  art: string;
}

export interface PublicSite {
  couple: string;
  partnerA: string;
  partnerB: string;
  date: string;
  place: string;
  cityName: string;
  guests: number;
  mood: string;
  style: "classic" | "city";
  headline: string;
  welcome: string;
  practical: string;
  dressCode: string;
  program: { title: string; start: string; place: string; icon: string; duration: number }[];
  team: { name: string; job: string; district: string }[];
  photos: { src: string; caption: string }[];
  music: { name: string; moment: string; url: string }[];
  memories: { title: string; text: string }[];
  publishedAt: string;
}

export interface PublicSiteRow {
  code: string;
  payload: PublicSite;
  publishedAt: string;
}

export type ViewId =
  | "monde"
  | "casting"
  | "crew"
  | "histoire"
  | "agenda"
  | "budget"
  | "jour-j"
  | "studio"
  | "radio"
  | "reglages"
  | "invites"
  | "aria";
