import { type ChurchEvent } from "./agenda";

export function generateGoogleCalendarUrl(event: ChurchEvent): string {
  const start = new Date(event.starts_at).toISOString().replace(/-|:|\.\d+/g, "");
  const end = event.ends_at
    ? new Date(event.ends_at).toISOString().replace(/-|:|\.\d+/g, "")
    : new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000)
        .toISOString()
        .replace(/-|:|\.\d+/g, "");

  const url = new URL("https://www.google.com/calendar/render");
  url.searchParams.append("action", "TEMPLATE");
  url.searchParams.append("text", event.title);
  url.searchParams.append("dates", `${start}/${end}`);
  if (event.description) url.searchParams.append("details", event.description);
  if (event.location) url.searchParams.append("location", event.location);

  return url.toString();
}

export function generateOutlookUrl(event: ChurchEvent): string {
  const start = new Date(event.starts_at).toISOString();
  const end = event.ends_at
    ? new Date(event.ends_at).toISOString()
    : new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000).toISOString();

  const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  url.searchParams.append("path", "/calendar/action/compose");
  url.searchParams.append("rru", "addevent");
  url.searchParams.append("subject", event.title);
  url.searchParams.append("startdt", start);
  url.searchParams.append("enddt", end);
  if (event.description) url.searchParams.append("body", event.description);
  if (event.location) url.searchParams.append("location", event.location);

  return url.toString();
}

export function generateICalData(event: ChurchEvent): string {
  const start = new Date(event.starts_at).toISOString().replace(/-|:|\.\d+/g, "");
  const end = event.ends_at
    ? new Date(event.ends_at).toISOString().replace(/-|:|\.\d+/g, "")
    : new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000)
        .toISOString()
        .replace(/-|:|\.\d+/g, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.location ? `LOCATION:${event.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\n");
}

export function downloadICal(event: ChurchEvent) {
  const data = generateICalData(event);
  const blob = new Blob([data], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
