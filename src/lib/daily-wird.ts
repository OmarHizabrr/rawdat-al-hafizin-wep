import { Timestamp } from "firebase/firestore";

export type WirdInputMode = "pages" | "range";

export interface CoursePlanTrack {
  id: string;
  title: string;
  totalPages: number;
  dailyRequiredPages?: number;
}

export interface DailyWirdEntry {
  id?: string;
  courseId: string;
  userId: string;
  date: string;
  trackId: string;
  mode: WirdInputMode;
  pagesCount?: number;
  fromPage?: number;
  toPage?: number;
  computedPages: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const DEFAULT_COURSE_TRACKS: CoursePlanTrack[] = [
  { id: "majlad-188", title: "المجلد 188", totalPages: 188 },
  { id: "majlad-193", title: "المجلد 193", totalPages: 193 },
  { id: "majlad-211", title: "المجلد 211", totalPages: 211 },
  { id: "majlad-176", title: "المجلد 176", totalPages: 176 },
  { id: "bukhari-mufradat-176", title: "مفردات البخاري", totalPages: 176 },
  { id: "muslim-mufradat-214", title: "مفردات مسلم", totalPages: 214 },
  { id: "abu-dawud-z1-271", title: "زوائد أبي داود (1)", totalPages: 271 },
  { id: "abu-dawud-z2-276", title: "زوائد أبي داود (2)", totalPages: 276 },
  { id: "tirmidhi-224", title: "الترمذي", totalPages: 224 },
  { id: "nasai-ibnmajah-darimi-142", title: "النسائي وابن ماجه والدارمي", totalPages: 142 },
  { id: "masanid-319", title: "المسانيد", totalPages: 319 },
  { id: "sihah-maajim-138", title: "الصحاح والمعاجم", totalPages: 138 },
];

export function computeWirdPages(mode: WirdInputMode, pagesCount?: number, fromPage?: number, toPage?: number) {
  if (mode === "pages") return Math.max(0, Number(pagesCount || 0));
  if (fromPage == null || toPage == null) return 0;
  return Math.max(0, Number(toPage) - Number(fromPage) + 1);
}
