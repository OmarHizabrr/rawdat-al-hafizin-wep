export type MeetingProvider = "google-meet" | "zoom" | "teams" | "other";

export interface MeetingProviderOption {
  id: MeetingProvider;
  label: string;
  createUrl: string;
}

const MEET_HOSTS = ["meet.google.com"];
const ZOOM_HOSTS = ["zoom.us", "us02web.zoom.us", "us05web.zoom.us"];
const TEAMS_HOSTS = ["teams.microsoft.com"];

export const meetingProviderOptions: MeetingProviderOption[] = [
  { id: "google-meet", label: "Google Meet", createUrl: "https://meet.google.com/new" },
  { id: "zoom", label: "Zoom", createUrl: "https://zoom.us/start/videomeeting" },
  { id: "teams", label: "Microsoft Teams", createUrl: "https://teams.microsoft.com/l/meeting/new" },
];

export function normalizeMeetingUrl(rawValue: string): { normalized: string; error?: string } {
  const trimmed = rawValue.trim();
  if (!trimmed) return { normalized: "", error: "أدخل رابط الاجتماع أولاً." };

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { normalized: trimmed, error: "الرابط غير صحيح. تأكد من نسخه كاملاً." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { normalized: trimmed, error: "نقبل فقط روابط الويب (http أو https)." };
  }

  // Meeting platforms work more reliably over https.
  parsed.protocol = "https:";

  return { normalized: parsed.toString() };
}

export function detectMeetingProvider(rawValue: string): MeetingProvider {
  const { normalized } = normalizeMeetingUrl(rawValue);
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    if (MEET_HOSTS.some((item) => host.includes(item))) return "google-meet";
    if (ZOOM_HOSTS.some((item) => host.includes(item))) return "zoom";
    if (TEAMS_HOSTS.some((item) => host.includes(item))) return "teams";
  } catch {
    return "other";
  }
  return "other";
}
