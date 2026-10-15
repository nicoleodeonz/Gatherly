import { useEffect, useMemo, useState } from "react";
import { api, workspaceApi } from "./api.js";

const sections = [
  { name: "Overview", icon: "overview" },
  { name: "User Management", icon: "users" },
  { name: "Events Management", icon: "calendar" },
  { name: "Analytics", icon: "chart" },
];

function AdminIcon({ name, className = "size-5" }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8M22 20v-2a4 4 0 0 0-3-3.87" /></>,
    calendar: <><path d="M7 2v3M17 2v3M3.5 9h17" /><rect x="3.5" y="4" width="17" height="17" rx="2.5" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    settings: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.8-2.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.5 15.5 0 0 1-4 4.7M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1 0 2-.2 2.9-.5" /></>,
  };

  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

const passwordSpecialCharacters = "!@#$%^&*()_+-=[]{}|;:'\",.<>/?~`";

function getPasswordRequirements(password) {
  return [
    ["At least 8 characters", password.length >= 8],
    ["At least one uppercase letter", /[A-Z]/.test(password)],
    ["At least one lowercase letter", /[a-z]/.test(password)],
    ["At least one digit", /\d/.test(password)],
    ["At least one special character", [...password].some((character) => passwordSpecialCharacters.includes(character))],
  ];
}

function getManilaParts(date) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).map(({ type, value }) => [type, value]));
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getAnalyticsRangeLabel(period, dateValue) {
  const selectedDate = new Date(`${dateValue}T00:00:00Z`);
  if (period === "month") {
    return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(selectedDate);
  }
  if (period === "day") {
    return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(selectedDate);
  }

  const weekStart = new Date(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const formatWeekDate = (date) => new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `${formatWeekDate(weekStart)} – ${formatWeekDate(weekEnd)}`;
}

function buildActivityBuckets(series, period, anchorDate) {
  const { year, month, day } = getManilaParts(anchorDate);
  const today = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const dailyCounts = new Map(series.daily.map(({ key, count }) => [key, count]));
  const hourlyCounts = new Map(series.hourly.map(({ key, count }) => [key, count]));

  if (period === "day") {
    return Array.from({ length: 24 }, (_, hour) => {
      const key = `${getDateKey(today)}-${String(hour).padStart(2, "0")}`;
      const hourLabel = hour % 12 || 12;
      return {
        key,
        label: `${hourLabel} ${hour < 12 ? "AM" : "PM"}`,
        value: hourlyCounts.get(key) || 0,
      };
    });
  }

  if (period === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + index);
      return {
        key: getDateKey(date),
        label: new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(date),
        value: dailyCounts.get(getDateKey(date)) || 0,
      };
    });
  }

  const firstOfMonth = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  const lastOfMonth = new Date(Date.UTC(Number(year), Number(month), 0));
  const firstWeekMonday = new Date(firstOfMonth);
  firstWeekMonday.setUTCDate(firstOfMonth.getUTCDate() - ((firstOfMonth.getUTCDay() + 6) % 7));
  const buckets = [];
  for (let weekStart = new Date(firstWeekMonday); weekStart <= lastOfMonth; weekStart.setUTCDate(weekStart.getUTCDate() + 7)) {
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const visibleStart = new Date(Math.max(weekStart.getTime(), firstOfMonth.getTime()));
    const visibleEnd = new Date(Math.min(weekEnd.getTime(), lastOfMonth.getTime()));
    let tickets = 0;
    for (const [key, count] of dailyCounts) {
      const date = new Date(`${key}T00:00:00Z`);
      if (date >= visibleStart && date <= visibleEnd) tickets += count;
    }
    buckets.push({
      key: getDateKey(weekStart),
      label: `${visibleStart.getUTCDate()}–${visibleEnd.getUTCDate()}`,
      value: tickets,
    });
  }
  return buckets;
}

function StatCard({ label, value, detail, icon }) {
  return (
    <article className="rounded-2xl border border-black/[.055] bg-white p-5 shadow-[0_2px_10px_rgba(20,18,26,.025)]">
      <div className="grid size-10 place-items-center rounded-xl bg-[#E9E5F3] text-[#756FB8]"><AdminIcon name={icon} /></div>
      <p className="mt-5 text-xs font-semibold text-black/40">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-black/40">{detail}</p>
    </article>
  );
}

function TrendChart({ title, metric, buckets, period }) {
  const maximum = Math.max(...buckets.map(({ value }) => value), 1);
  const points = buckets.map((bucket, index) => ({
    ...bucket,
    x: 68 + (buckets.length > 1 ? index * (620 / (buckets.length - 1)) : 378),
    y: 190 - (bucket.value / maximum) * 160,
  }));
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);

  return (
    <>
      <div className="mt-4">
        <p className="text-3xl font-extrabold">{total.toLocaleString("en-PH")}</p>
        <p className="mt-1 text-xs text-black/40">{metric} in selected period</p>
      </div>
      <div className="mt-4 w-full overflow-x-auto">
        <svg viewBox="0 0 720 240" role="img" aria-label={`${title}, grouped by ${period}`} className="h-64 min-w-[600px] w-full">
          {[0, 1, 2, 3].map((tick) => {
            const y = 190 - tick * (160 / 3);
            const value = maximum * tick / 3;
            return <g key={tick}>
              <line x1="48" y1={y} x2="708" y2={y} stroke="#EAE8E5" strokeDasharray={tick === 0 ? "0" : "4 5"} />
              <text x="42" y={y + 4} textAnchor="end" className="fill-black/40 text-[9px]">{Math.round(value)}</text>
            </g>;
          })}
          {points.length > 1 && <polyline points={line} fill="none" stroke="#756FB8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((point) => <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="4" fill="white" stroke="#756FB8" strokeWidth="2">
              <title>{`${point.label}: ${point.value} ${metric.toLowerCase()}`}</title>
            </circle>
          </g>)}
          {points.map((point, index) => {
            const labelInterval = period === "day" ? 4 : 1;
            if (index % labelInterval !== 0 && index !== points.length - 1) return null;
            return <text key={point.key} x={point.x} y="218" textAnchor="middle" className="fill-black/45 text-[10px]">{point.label}</text>;
          })}
        </svg>
      </div>
      <p className="mt-1 text-[11px] text-black/40">
        {period === "day" ? "Hourly activity for the selected day." : period === "week" ? "Daily activity for the selected week." : "Weekly activity for the selected month."}
      </p>
    </>
  );
}

function pdfText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function drawPdfText(commands, text, x, y, size = 10, bold = false, color = "0.16 0.17 0.23") {
  commands.push(`${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(text)}) Tj ET`);
}

function commandsRect(commands, x, y, width, height, color) {
  commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
}

function drawPdfParagraph(commands, text, x, y, maxCharacters, size = 10, color = "0.16 0.17 0.23") {
  const words = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .split(/\s+/);
  let line = "";
  let currentY = y;
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      drawPdfText(commands, line, x, currentY, size, false, color);
      currentY -= size + 4;
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) {
    drawPdfText(commands, line, x, currentY, size, false, color);
    currentY -= size + 4;
  }
  return currentY;
}

function drawPdfReportHeader(commands, title, subtitle) {
  commands.push("0.46 0.42 0.72 rg 42 710 528 52 re f");
  drawPdfText(commands, "GATHERLY  /  ANALYTICS", 58, 744, 8, true, "1 1 1");
  drawPdfText(commands, title, 58, 724, 16, true, "1 1 1");
  if (subtitle) drawPdfText(commands, subtitle, 58, 694, 9, false, "0.42 0.42 0.47");
}

function drawPdfLineChart(commands, { title, range, buckets, metric, period, top }) {
  const chartLeft = 78;
  const chartRight = 558;
  const chartTop = top - 62;
  const chartBottom = top - 200;
  const chartHeight = chartTop - chartBottom;
  const maximum = Math.max(...buckets.map(({ value }) => value), 1);

  drawPdfText(commands, title, 48, top, 14, true);
  drawPdfText(commands, range, 48, top - 17, 9, false, "0.42 0.42 0.47");
  drawPdfText(commands, `${buckets.reduce((sum, bucket) => sum + bucket.value, 0).toLocaleString("en-PH")} ${metric.toLowerCase()}`, 48, top - 40, 11, true);
  drawPdfText(commands, period === "day" ? "Hourly" : period === "week" ? "Daily" : "Weekly", 508, top - 40, 8, true, "0.46 0.42 0.72");

  const ticks = [...new Set([0, Math.ceil(maximum / 3), Math.ceil((maximum * 2) / 3), maximum])];
  ticks.forEach((value) => {
    const y = chartBottom + (value / maximum) * chartHeight;
    commands.push(`0.88 0.87 0.86 RG 0.5 w ${chartLeft} ${y.toFixed(2)} m ${chartRight} ${y.toFixed(2)} l S`);
    drawPdfText(commands, String(value), 52, y - 3, 8, false, "0.42 0.42 0.47");
  });

  const points = buckets.map((bucket, index) => ({
    ...bucket,
    x: chartLeft + (buckets.length > 1 ? index * ((chartRight - chartLeft) / (buckets.length - 1)) : (chartRight - chartLeft) / 2),
    y: chartBottom + (bucket.value / maximum) * chartHeight,
  }));
  if (points.length > 1) {
    commands.push(`0.46 0.42 0.72 RG 2.5 w 1 J 1 j ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} m`);
    points.slice(1).forEach((point) => commands.push(`${point.x.toFixed(2)} ${point.y.toFixed(2)} l`));
    commands.push("S");
  }
  points.forEach((point, index) => {
    commands.push(`0.46 0.42 0.72 rg ${point.x - 2.2} ${point.y - 2.2} 4.4 4.4 re f`);
    const interval = period === "day" ? 4 : 1;
    if (index % interval === 0 || index === points.length - 1) {
      const labelWidth = Math.min(52, point.label.length * 4.2);
      drawPdfText(commands, point.label, Math.max(chartLeft, Math.min(chartRight - labelWidth, point.x - labelWidth / 2)), chartBottom - 16, 7, false, "0.42 0.42 0.47");
    }
  });
}

function drawPdfTable(commands, { title, items, x, width, rowHeight, labelLimit }) {
  drawPdfText(commands, title, x, 665, 12, true);
  drawPdfText(commands, "Name", x + 8, 642, 8, true, "0.42 0.42 0.47");
  drawPdfText(commands, "Count", x + width - 42, 642, 8, true, "0.42 0.42 0.47");
  commands.push(`0.46 0.42 0.72 rg ${x} 632 ${width} 2 re f`);
  if (items.length === 0) {
    drawPdfText(commands, "No data available.", x + 8, 613, 9, false, "0.42 0.42 0.47");
    return;
  }
  items.forEach((item, index) => {
    const rowY = 613 - index * rowHeight;
    const label = item.label.length > labelLimit ? `${item.label.slice(0, labelLimit - 3)}...` : item.label;
    if (index % 2 === 0) commandsRect(commands, x, rowY - 7, width, rowHeight, "0.97 0.96 0.99");
    drawPdfText(commands, label, x + 8, rowY + 2, 8, false);
    drawPdfText(commands, item.value.toLocaleString("en-PH"), x + width - 42, rowY + 2, 8, true);
    commands.push(`0.89 0.88 0.90 RG 0.4 w ${x} ${rowY - 7} m ${x + width} ${rowY - 7} l S`);
  });
}

function drawPdfSummarySection(commands, title, items, startY) {
  drawPdfText(commands, title, 48, startY, 14, true);
  let currentY = startY - 23;
  if (items.length === 0) {
    drawPdfText(commands, "No additional notes.", 56, currentY, 9, false, "0.42 0.42 0.47");
    return currentY - 18;
  }
  items.forEach((item) => {
    drawPdfText(commands, "-", 52, currentY, 10, true, "0.46 0.42 0.72");
    currentY = drawPdfParagraph(commands, item, 67, currentY, 88, 9);
    currentY -= 5;
  });
  return currentY - 10;
}

function downloadAnalyticsPdf({ accountCreationRangeLabel, accountCreationBuckets, accountCreationPeriod, ticketSalesRangeLabel, ticketSalesBuckets, ticketSalesPeriod, analytics, report }) {
  const pages = [];
  const generatedAt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date());
  const metrics = [];
  drawPdfReportHeader(metrics, "Platform overview", `Snapshot and selected period · ${generatedAt}`);
  const cards = [
    ["Organizer accounts", analytics.totalUsers.toLocaleString("en-PH")],
    ["Events", analytics.totalEvents.toLocaleString("en-PH")],
    ["Attendees", analytics.totalAttendees.toLocaleString("en-PH")],
    ["Processing fee revenue", `PHP ${analytics.totalRevenue.toLocaleString("en-PH")}`],
    ["Accounts created", report.metrics.accountsCreated.toLocaleString("en-PH")],
    ["Archived accounts", report.metrics.archivedAccounts.toLocaleString("en-PH")],
    ["Tickets sold", report.metrics.ticketsSold.toLocaleString("en-PH")],
    ["Check-in rate", `${report.metrics.checkInRate}%`],
  ];
  cards.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 48 + column * 265;
    const y = 590 - row * 112;
    commandsRect(metrics, x, y, 252, 88, "0.97 0.96 0.99");
    drawPdfText(metrics, label, x + 15, y + 56, 9, false, "0.42 0.42 0.47");
    drawPdfText(metrics, value, x + 15, y + 26, 18, true, "0.28 0.25 0.47");
  });
  drawPdfText(metrics, `Paid orders: ${analytics.paidOrders.toLocaleString("en-PH")}`, 48, 112, 10, true);
  pages.push(metrics);

  const trendsPage = [];
  drawPdfReportHeader(trendsPage, "Platform trends", "Account creations and ticket sales");
  drawPdfLineChart(trendsPage, {
    title: "Account creations",
    range: accountCreationRangeLabel,
    buckets: accountCreationBuckets,
    metric: "Accounts created",
    period: accountCreationPeriod,
    top: 662,
  });
  drawPdfLineChart(trendsPage, {
    title: "Ticket sales",
    range: ticketSalesRangeLabel,
    buckets: ticketSalesBuckets,
    metric: "Tickets sold",
    period: ticketSalesPeriod,
    top: 380,
  });
  pages.push(trendsPage);

  const statusPage = [];
  drawPdfReportHeader(statusPage, "Platform breakdowns", "Event status and attendee discovery sources");
  drawPdfTable(statusPage, {
    title: "Event status",
    items: ["On sale", "Draft", "Finished", "Cancelled"].map((label) => ({ label, value: analytics.eventStatuses[label] || 0 })),
    x: 48,
    width: 236,
    rowHeight: 29,
    labelLimit: 22,
  });
  drawPdfTable(statusPage, {
    title: "Attendee discovery sources",
    items: analytics.discoverySources.map(({ label, count }) => ({ label, value: count })),
    x: 324,
    width: 236,
    rowHeight: 17,
    labelLimit: 23,
  });
  pages.push(statusPage);

  const summaryPage = [];
  drawPdfReportHeader(summaryPage, "Final summary", `AI-assisted review | ${generatedAt}`);
  drawPdfText(summaryPage, "Performance overview", 48, 665, 14, true);
  let summaryY = drawPdfParagraph(summaryPage, report.executiveSummary, 48, 642, 88, 10);
  summaryY -= 14;
  summaryY = drawPdfSummarySection(summaryPage, "Highlights", report.highlights, summaryY);
  summaryY = drawPdfSummarySection(summaryPage, "Risks", report.risks, summaryY);
  drawPdfSummarySection(summaryPage, "Recommended actions", report.recommendations, summaryY);
  pages.push(summaryPage);

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const pageReferences = [];
  pages.forEach((commands, index) => {
    drawPdfText(commands, "GATHERLY  |  ADMIN ANALYTICS", 48, 30, 8, true, "0.52 0.50 0.60");
    drawPdfText(commands, `${index + 1} / ${pages.length}`, 530, 30, 8, false, "0.52 0.50 0.60");
    const contentId = 5 + index * 2;
    const pageId = contentId + 1;
    const stream = commands.join("\n");
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageReferences.push(`${pageId} 0 R`);
  });
  objects[2] = `<< /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "gatherly-analytics.pdf";
  link.click();
  URL.revokeObjectURL(url);
}

function buildAnalyticsExportTables({
  analytics,
  accountCreationActivity,
  accountCreationBuckets,
  accountCreationPeriod,
  accountCreationRangeLabel,
  ticketActivity,
  ticketSalesBuckets,
  ticketSalesPeriod,
  ticketSalesRangeLabel,
}) {
  const checkInRate = ticketActivity.totalAttendees
    ? Math.round((ticketActivity.checkedInAttendees / ticketActivity.totalAttendees) * 100)
    : 0;
  return [
    {
      name: "Platform Overview",
      rows: [
        ["Metric", "Value"],
        ["Organizer accounts", analytics.totalUsers],
        ["Events", analytics.totalEvents],
        ["Events currently on sale", analytics.activeEvents],
        ["Total attendees", analytics.totalAttendees],
        ["Checked-in attendees", analytics.checkedInAttendees],
        ["Processing fee revenue (PHP)", analytics.totalRevenue],
        ["Paid orders", analytics.paidOrders],
        ["Accounts created in selected period", accountCreationActivity.totalAccountsCreated],
        ["Archived accounts in selected period", accountCreationActivity.totalArchivedAccounts],
        ["Tickets sold in selected period", ticketActivity.totalTicketsSold],
        ["Checked-in attendees in selected period", ticketActivity.checkedInAttendees],
        ["Check-in rate in selected period (%)", checkInRate],
      ],
    },
    {
      name: "Account Creations",
      rows: [
        ["Period", accountCreationPeriod],
        ["Selected range", accountCreationRangeLabel],
        [],
        ["Bucket", "Accounts created"],
        ...accountCreationBuckets.map(({ label, value }) => [label, value]),
      ],
    },
    {
      name: "Ticket Sales",
      rows: [
        ["Period", ticketSalesPeriod],
        ["Selected range", ticketSalesRangeLabel],
        [],
        ["Bucket", "Tickets sold"],
        ...ticketSalesBuckets.map(({ label, value }) => [label, value]),
      ],
    },
    {
      name: "Event Status",
      rows: [
        ["Status", "Events"],
        ...["On sale", "Draft", "Finished", "Cancelled"].map((status) => [status, analytics.eventStatuses[status] || 0]),
      ],
    },
    {
      name: "Discovery Sources",
      rows: [
        ["Source", "Attendees"],
        ...analytics.discoverySources.map(({ label, count }) => [label, count]),
      ],
    },
  ];
}

function buildManagementExportTables(activeSection, records) {
  if (activeSection === "User Management") {
    return [{
      name: "Accounts",
      rows: [
        ["Name", "Email", "Role", "Joined", "Status"],
        ...records.map((account) => [
          account.name || "",
          account.email || "",
          account.accountType === "admin" ? "Admin" : "Organizer",
          formatDate(account.createdAt),
          account.disabledAt || account.archivedAt ? "Disabled" : "Active",
        ]),
      ],
    }];
  }

  return [{
    name: "Platform Events",
    rows: [
      ["Event", "Event code", "Organizer", "Organizer email", "Date", "Tickets sold", "Capacity", "Status"],
      ...records.map((event) => [
        event.name || "Untitled event",
        event.eventCode || "No event code",
        event.organizerName || "Unknown organizer",
        event.organizerEmail || "",
        formatDate(event.date),
        Number(event.sold || 0),
        Number(event.total || 0),
        event.status || "Unknown",
      ]),
    ],
  }];
}

function downloadAnalyticsCsv(tables, fileName = "gatherly-analytics.csv") {
  const escapeCell = (value) => {
    const text = String(value ?? "");
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const csv = tables.flatMap(({ name, rows }) => [
    [name],
    ...rows,
    [],
  ]).map((row) => row.map(escapeCell).join(",")).join("\r\n");
  downloadBlob(`\uFEFF${csv}`, "text/csv;charset=utf-8", fileName);
}

function downloadAnalyticsXls(tables, fileName = "gatherly-analytics.xls") {
  const escapeXml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  const worksheets = tables.map(({ name, rows }) => {
    const safeName = name.slice(0, 31);
    const tableRows = rows.map((row) => `<Row>${row.map((value) => {
      const type = typeof value === "number" && Number.isFinite(value) ? "Number" : "String";
      return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
    }).join("")}</Row>`).join("");
    return `<Worksheet ss:Name="${escapeXml(safeName)}"><Table>${tableRows}</Table></Worksheet>`;
  }).join("");
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">${worksheets}</Workbook>`;
  downloadBlob(`\uFEFF${workbook}`, "application/vnd.ms-excel;charset=utf-8", fileName);
}

function downloadManagementPdf({ title, tables }) {
  const pages = [];
  const rowsPerPage = 23;
  tables.forEach(({ name, rows }) => {
    const header = rows[0] || [];
    const dataRows = rows.slice(1);
    const chunks = dataRows.length > 0
      ? Array.from({ length: Math.ceil(dataRows.length / rowsPerPage) }, (_, index) => dataRows.slice(index * rowsPerPage, (index + 1) * rowsPerPage))
      : [[]];
    chunks.forEach((chunk, chunkIndex) => {
      const commands = [];
      commands.push("0.46 0.42 0.72 rg 40 724 532 48 re f");
      drawPdfText(commands, "GATHERLY  /  ADMIN WORKSPACE", 54, 754, 8, true, "1 1 1");
      drawPdfText(commands, title, 54, 735, 15, true, "1 1 1");
      drawPdfText(commands, `${name}${chunks.length > 1 ? ` (continued ${chunkIndex + 1}/${chunks.length})` : ""}`, 48, 700, 12, true);

      const columnCount = Math.max(header.length, 1);
      const columnWidth = 532 / columnCount;
      const headerY = 674;
      commandsRect(commands, 40, headerY - 8, 532, 22, "0.94 0.93 0.97");
      header.forEach((cell, columnIndex) => {
        const cellText = String(cell ?? "");
        const maxLength = Math.max(7, Math.floor((columnWidth - 12) / 4.6));
        const label = cellText.length > maxLength ? `${cellText.slice(0, maxLength - 3)}...` : cellText;
        drawPdfText(commands, label, 46 + columnIndex * columnWidth, headerY, 8, true, "0.28 0.25 0.47");
      });

      if (chunk.length === 0) {
        drawPdfText(commands, "No matching records.", 48, 642, 9, false, "0.42 0.42 0.47");
      }
      chunk.forEach((row, rowIndex) => {
        const rowY = 650 - rowIndex * 26;
        if (rowIndex % 2 === 0) commandsRect(commands, 40, rowY - 7, 532, 24, "0.985 0.98 0.99");
        row.forEach((cell, columnIndex) => {
          const cellText = String(cell ?? "");
          const maxLength = Math.max(7, Math.floor((columnWidth - 12) / 4.2));
          const label = cellText.length > maxLength ? `${cellText.slice(0, maxLength - 3)}...` : cellText;
          drawPdfText(commands, label, 46 + columnIndex * columnWidth, rowY, 7, false);
        });
      });
      pages.push(commands);
    });
  });

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const pageReferences = [];
  pages.forEach((commands, index) => {
    drawPdfText(commands, "GATHERLY  |  ADMIN DATA EXPORT", 40, 30, 8, true, "0.52 0.50 0.60");
    drawPdfText(commands, `${index + 1} / ${pages.length}`, 540, 30, 8, false, "0.52 0.50 0.60");
    const contentId = 5 + index * 2;
    const pageId = contentId + 1;
    const stream = commands.join("\n");
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageReferences.push(`${pageId} 0 R`);
  });
  objects[2] = `<< /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  downloadBlob(pdf, "application/pdf", `gatherly-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

function downloadBlob(content, mimeType, fileName) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AnalyticsFilters({ period, date, maxDate, maxMonth, onDateChange, onPeriodChange, idPrefix }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-black/50">
        <span>{period === "month" ? "Month" : "Start date"}</span>
        <input
          aria-label={`${idPrefix} ${period === "month" ? "month" : "start date"}`}
          type={period === "month" ? "month" : "date"}
          value={period === "month" ? date.slice(0, 7) : date}
          max={period === "month" ? maxMonth : maxDate}
          onChange={(event) => onDateChange(period === "month" ? `${event.target.value}-01` : event.target.value)}
          className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-[#2D3142] outline-none focus:border-[#756FB8]"
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-semibold text-black/50">
        <span>Show</span>
        <select aria-label={`${idPrefix} time period`} value={period} onChange={(event) => onPeriodChange(event.target.value)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-[#2D3142] outline-none focus:border-[#756FB8]">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>
    </div>
  );
}

function AdminPagination({ itemCount, page, onPageChange, pageSize }) {
  const pageCount = Math.ceil(itemCount / pageSize);
  if (pageCount <= 1) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, itemCount);

  return (
    <div className="flex flex-col gap-3 border-t border-black/[.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-[11px] text-black/40">Showing {firstItem}–{lastItem} of {itemCount.toLocaleString("en-PH")}</p>
      <nav aria-label="Table pagination" className="flex items-center justify-end gap-1">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-black/[.07] px-3 py-2 text-[11px] font-bold text-black/55 hover:bg-[#F8F6F3] disabled:cursor-not-allowed disabled:opacity-30">Previous</button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === page ? "page" : undefined}
            aria-label={`Page ${pageNumber}`}
            onClick={() => onPageChange(pageNumber)}
            className={`grid size-9 place-items-center rounded-lg text-[11px] font-bold ${pageNumber === page ? "bg-[#756FB8] text-white" : "border border-black/[.07] text-black/55 hover:bg-[#F8F6F3]"}`}
          >
            {pageNumber}
          </button>
        ))}
        <button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-black/[.07] px-3 py-2 text-[11px] font-bold text-black/55 hover:bg-[#F8F6F3] disabled:cursor-not-allowed disabled:opacity-30">Next</button>
      </nav>
    </div>
  );
}

export default function AdminDashboard({ user, onSignOut, onUserUpdate }) {
  const pageSize = 5;
  const [active, setActive] = useState("Overview");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsExportError, setAnalyticsExportError] = useState("");
  const [analyticsExporting, setAnalyticsExporting] = useState(false);
  const [analyticsExportMenuOpen, setAnalyticsExportMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [accountCreationPeriod, setAccountCreationPeriod] = useState("day");
  const [accountCreationDate, setAccountCreationDate] = useState(() => {
    const { year, month, day } = getManilaParts(new Date());
    return `${year}-${month}-${day}`;
  });
  const [accountCreationActivity, setAccountCreationActivity] = useState(null);
  const [accountCreationError, setAccountCreationError] = useState(null);
  const [ticketSalesPeriod, setTicketSalesPeriod] = useState("day");
  const [ticketSalesDate, setTicketSalesDate] = useState(() => {
    const { year, month, day } = getManilaParts(new Date());
    return `${year}-${month}-${day}`;
  });
  const [ticketActivity, setTicketActivity] = useState(null);
  const [ticketActivityError, setTicketActivityError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAction, setProfileAction] = useState("");
  const [profileName, setProfileName] = useState(user.name);
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileCurrentPasswordCheck, setProfileCurrentPasswordCheck] = useState({ state: "empty", value: "", message: "" });
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileNewPasswordCheck, setProfileNewPasswordCheck] = useState({ state: "empty", value: "", message: "" });
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profilePasswordVisibility, setProfilePasswordVisibility] = useState({ current: false, new: false, confirm: false });
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [pendingAccountAction, setPendingAccountAction] = useState(null);
  const [accountActionError, setAccountActionError] = useState("");
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("organizer");
  const [createUserError, setCreateUserError] = useState("");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [processingFeeModalOpen, setProcessingFeeModalOpen] = useState(false);
  const [processingFeeConfirmation, setProcessingFeeConfirmation] = useState(null);
  const [processingFeeInput, setProcessingFeeInput] = useState("");
  const [processingFeeError, setProcessingFeeError] = useState("");
  const [processingFeeSaving, setProcessingFeeSaving] = useState(false);

  useEffect(() => {
    if (profileAction !== "password" || !profileCurrentPassword) {
      return undefined;
    }

    let activeRequest = true;
    const timeoutId = window.setTimeout(() => {
      api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: user.email, password: profileCurrentPassword }),
      }).then(() => {
        if (activeRequest) {
          setProfileCurrentPasswordCheck({
            state: "valid",
            value: profileCurrentPassword,
            message: "Current password is correct.",
          });
        }
      }).catch((requestError) => {
        if (!activeRequest) return;
        if (requestError.status === 401) {
          setProfileCurrentPasswordCheck({
            state: "invalid",
            value: profileCurrentPassword,
            message: "This does not match your current password.",
          });
        } else {
          setProfileCurrentPasswordCheck({ state: "error", value: profileCurrentPassword, message: requestError.message });
        }
      });
    }, 350);

    return () => {
      activeRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [profileAction, profileCurrentPassword, user.email]);

  useEffect(() => {
    if (profileAction !== "password" || !profileNewPassword || !getPasswordRequirements(profileNewPassword).every(([, met]) => met)) {
      return undefined;
    }

    let activeRequest = true;
    const timeoutId = window.setTimeout(() => {
      api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: user.email, password: profileNewPassword }),
      }).then(() => {
        if (activeRequest) {
          setProfileNewPasswordCheck({
            state: "same",
            value: profileNewPassword,
            message: "New password must be different from your current password.",
          });
        }
      }).catch((requestError) => {
        if (!activeRequest) return;
        if (requestError.status === 401) {
          setProfileNewPasswordCheck({
            state: "different",
            value: profileNewPassword,
            message: "New password is different from your current password.",
          });
        } else {
          setProfileNewPasswordCheck({ state: "error", value: profileNewPassword, message: requestError.message });
        }
      });
    }, 350);

    return () => {
      activeRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [profileAction, profileNewPassword, user.email]);

  async function saveProfileName(event) {
    event.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const { user: updatedUser } = await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: profileName }),
      });
      onUserUpdate(updatedUser);
      setProfileName(updatedUser.name);
      setProfileAction("");
      setProfileMessage("Your name has been updated.");
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function changeProfilePassword(event) {
    event.preventDefault();
    if (profileSaving) return;
    if (profileNewPassword !== profileConfirmPassword) {
      setProfileError("The new passwords do not match.");
      return;
    }
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const result = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: profileCurrentPassword,
          newPassword: profileNewPassword,
          confirmNewPassword: profileConfirmPassword,
        }),
      });
      setProfileCurrentPassword("");
      setProfileCurrentPasswordCheck({ state: "empty", value: "", message: "" });
      setProfileNewPassword("");
      setProfileNewPasswordCheck({ state: "empty", value: "", message: "" });
      setProfileConfirmPassword("");
      setProfilePasswordVisibility({ current: false, new: false, confirm: false });
      setProfileAction("");
      setProfileMessage(result.message);
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setProfileSaving(false);
    }
  }

  useEffect(() => {
    let activeRequest = true;
    workspaceApi().then(({ users: loadedUsers, events: loadedEvents, analytics: loadedAnalytics }) => {
      if (!activeRequest) return;
      setUsers(loadedUsers);
      setEvents(loadedEvents);
      setAnalytics(loadedAnalytics);
    }).catch((requestError) => {
      if (activeRequest) setError(requestError.message);
    }).finally(() => {
      if (activeRequest) setLoading(false);
    });

    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    let activeRequest = true;
    workspaceApi({
      path: "/ticket-activity",
      searchParams: { period: ticketSalesPeriod, date: ticketSalesDate },
    }).then((activity) => {
      if (activeRequest) {
        setTicketActivity({ ...activity, period: ticketSalesPeriod, date: ticketSalesDate });
      }
    }).catch((requestError) => {
      if (activeRequest) {
        setTicketActivityError({ period: ticketSalesPeriod, date: ticketSalesDate, message: requestError.message });
      }
    });
    return () => { activeRequest = false; };
  }, [ticketSalesDate, ticketSalesPeriod]);

  useEffect(() => {
    let activeRequest = true;
    workspaceApi({
      path: "/ticket-activity",
      searchParams: { period: accountCreationPeriod, date: accountCreationDate },
    }).then((activity) => {
      if (activeRequest) {
        setAccountCreationActivity({ ...activity, period: accountCreationPeriod, date: accountCreationDate });
      }
    }).catch((requestError) => {
      if (activeRequest) {
        setAccountCreationError({ period: accountCreationPeriod, date: accountCreationDate, message: requestError.message });
      }
    });
    return () => { activeRequest = false; };
  }, [accountCreationDate, accountCreationPeriod]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return users.filter((account) => Boolean(account.disabledAt || account.archivedAt) === showArchives).filter((account) => !query
      || [account.name, account.email].some((value) => value?.toLocaleLowerCase().includes(query)))
      .filter((account) => userRoleFilter === "all"
        || (userRoleFilter === "admins" ? account.accountType === "admin" : account.accountType !== "admin"));
  }, [search, showArchives, userRoleFilter, users]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return events.filter((event) => !query
      || [event.name, event.eventCode, event.venue, event.organizerName, event.organizerEmail, event.status]
        .some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [events, search]);

  const currentItemCount = active === "Events Management"
    ? filteredEvents.length
    : active === "User Management" ? filteredUsers.length : 0;
  const pageCount = Math.ceil(currentItemCount / pageSize);
  const currentPage = pageCount > 0 ? Math.min(page, pageCount) : 1;
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredUsers, currentPage],
  );
  const paginatedEvents = useMemo(
    () => filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredEvents, currentPage],
  );
  const selectedTicketActivity = ticketActivity?.period === ticketSalesPeriod
    && ticketActivity.date === ticketSalesDate ? ticketActivity : null;
  const selectedActivityError = ticketActivityError?.period === ticketSalesPeriod
    && ticketActivityError.date === ticketSalesDate ? ticketActivityError.message : "";
  const selectedAccountActivity = accountCreationActivity?.period === accountCreationPeriod
    && accountCreationActivity.date === accountCreationDate ? accountCreationActivity : null;
  const selectedAccountActivityError = accountCreationError?.period === accountCreationPeriod
    && accountCreationError.date === accountCreationDate ? accountCreationError.message : "";
  const accountCreationRangeLabel = getAnalyticsRangeLabel(accountCreationPeriod, accountCreationDate);
  const ticketSalesRangeLabel = getAnalyticsRangeLabel(ticketSalesPeriod, ticketSalesDate);
  const { year: currentYear, month: currentMonth, day: currentDay } = getManilaParts(new Date());
  const currentAnalyticsDate = `${currentYear}-${currentMonth}-${currentDay}`;
  const currentAnalyticsMonth = `${currentYear}-${currentMonth}`;
  const selectedTicketDate = useMemo(() => new Date(`${ticketSalesDate}T00:00:00Z`), [ticketSalesDate]);
  const selectedAccountDate = useMemo(() => new Date(`${accountCreationDate}T00:00:00Z`), [accountCreationDate]);
  const ticketSalesBuckets = useMemo(
    () => selectedTicketActivity
      ? buildActivityBuckets(selectedTicketActivity.ticketSales, ticketSalesPeriod, selectedTicketDate)
      : [],
    [selectedTicketActivity, selectedTicketDate, ticketSalesPeriod],
  );
  const accountCreationBuckets = useMemo(
    () => selectedAccountActivity
      ? buildActivityBuckets(selectedAccountActivity.accountCreations, accountCreationPeriod, selectedAccountDate)
      : [],
    [selectedAccountActivity, selectedAccountDate, accountCreationPeriod],
  );

  function handleTableExport(format) {
    setAnalyticsExportError("");
    try {
      const tables = active === "Analytics"
        ? buildAnalyticsExportTables({
          analytics,
          accountCreationActivity: selectedAccountActivity,
          accountCreationBuckets,
          accountCreationPeriod,
          accountCreationRangeLabel,
          ticketActivity: selectedTicketActivity,
          ticketSalesBuckets,
          ticketSalesPeriod,
          ticketSalesRangeLabel,
        })
        : buildManagementExportTables(active === "Events Management" ? "Events" : active, active === "Events Management" ? filteredEvents : filteredUsers);
      const baseFileName = active === "Analytics"
        ? "gatherly-analytics"
        : active === "Events Management" ? "gatherly-events" : showArchives ? "gatherly-archived-accounts" : "gatherly-users";
      if (format === "csv") downloadAnalyticsCsv(tables, `${baseFileName}.csv`);
      else if (format === "xls") downloadAnalyticsXls(tables, `${baseFileName}.xls`);
      else downloadManagementPdf({
        title: active === "User Management" ? (showArchives ? "Archived accounts" : "User management") : "Events management",
        tables,
      });
      setAnalyticsExportMenuOpen(false);
    } catch (exportError) {
      setAnalyticsExportError(`Could not export ${active.toLowerCase()} ${format.toUpperCase()}: ${exportError.message}`);
    }
  }

  async function handleSignOut() {
    setSignOutError("");
    setSigningOut(true);
    try {
      await onSignOut();
    } catch (signOutRequestError) {
      setSignOutError(signOutRequestError.message);
      setSigningOut(false);
    }
  }

  async function confirmAccountAction() {
    if (!pendingAccountAction || accountActionLoading) return;
    setAccountActionLoading(true);
    setAccountActionError("");
    try {
      const updatedAccount = await workspaceApi({
        method: "PATCH",
        body: JSON.stringify({
          accountId: pendingAccountAction.account.id,
          accountType: pendingAccountAction.account.accountType,
          disabled: pendingAccountAction.value,
        }),
      });
      setUsers((current) => current.map((account) => (
        account.id === updatedAccount.id ? updatedAccount : account
      )));
      setPendingAccountAction(null);
      setWorkspaceNotice(
        pendingAccountAction.value
          ? "Customer account disabled and moved to Archives."
          : "Customer account enabled and returned to User Management.",
      );
    } catch (requestError) {
      setAccountActionError(requestError.message);
    } finally {
      setAccountActionLoading(false);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    if (createUserLoading) return;
    setCreateUserLoading(true);
    setCreateUserError("");
    try {
      const createdAccount = await workspaceApi({
        method: "POST",
        body: JSON.stringify({ name: newUserName, email: newUserEmail, role: newUserRole }),
      });
      setUsers((current) => [{ ...createdAccount, accountType: createdAccount.accountType || (newUserRole === "admin" ? "admin" : "customer") }, ...current]);
      setCreateUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setWorkspaceNotice(`${newUserRole === "admin" ? "Admin" : "Organizer"} account created. A temporary password was emailed to ${createdAccount.email}.`);
      setNewUserRole("organizer");
    } catch (requestError) {
      setCreateUserError(requestError.message);
    } finally {
      setCreateUserLoading(false);
    }
  }

  function requestProcessingFeeSave(event) {
    event.preventDefault();
    const amount = Number(processingFeeInput);
    const processingFeeCents = Math.round(amount * 100);
    if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(processingFeeInput.trim())
      || !Number.isFinite(amount) || amount < 0
      || !Number.isSafeInteger(processingFeeCents)) {
      setProcessingFeeError("Enter a valid non-negative fee with up to two decimal places.");
      return;
    }
    setProcessingFeeError("");
    setProcessingFeeConfirmation(processingFeeCents);
  }

  async function confirmProcessingFeeSave() {
    if (processingFeeConfirmation === null || processingFeeSaving) return;
    setProcessingFeeSaving(true);
    setProcessingFeeError("");
    try {
      const { processingFeeCents } = await workspaceApi({
        method: "PATCH",
        body: JSON.stringify({ processingFeeCents: processingFeeConfirmation }),
      });
      setAnalytics((current) => current
        ? { ...current, processingFeeCents }
        : current);
      setProcessingFeeConfirmation(null);
      setProcessingFeeModalOpen(false);
      setWorkspaceNotice("Processing fee updated. The new fee applies to future ticket registrations.");
    } catch (requestError) {
      setProcessingFeeError(requestError.message);
    } finally {
      setProcessingFeeSaving(false);
    }
  }

  const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#2D3142]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#2D3142] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#756FB8]"><div className="size-3 rotate-45 rounded-[3px] border-2 border-white" /></div>
            <span className="text-xl font-extrabold tracking-tight">Gatherly</span>
          </div>
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><AdminIcon name="close" /></button>
        </div>
        <div className="px-4 pt-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Admin workspace</p>
          <nav aria-label="Admin workspace" className="space-y-1">
            {sections.map(({ name, icon }) => (
              <button key={name} onClick={() => { setActive(name); setSearch(""); setPage(1); setMobileOpen(false); setAnalyticsExportMenuOpen(false); }} aria-current={active === name ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${active === name ? "bg-white text-[#2D3142]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                <AdminIcon name={icon} className="size-[19px]" />{name}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-5">
          <p className="text-xs font-bold">{user.name}</p>
          <p className="mt-1 truncate text-[11px] text-white/45">{user.email}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#C4BEE5]">Administrator</p>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-black/[.06] bg-[#F7F4EF]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <button className="mr-3 rounded-xl border border-black/10 bg-white p-2.5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><AdminIcon name="menu" /></button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#756FB8]">Gatherly · Admin</p>
            <p className="mt-1 text-sm font-bold">{active}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setProfileName(user.name);
                setProfileAction("");
                setProfileCurrentPassword("");
                setProfileCurrentPasswordCheck({ state: "empty", value: "", message: "" });
                setProfileNewPassword("");
                setProfileNewPasswordCheck({ state: "empty", value: "", message: "" });
                setProfileConfirmPassword("");
                setProfilePasswordVisibility({ current: false, new: false, confirm: false });
                setProfileError("");
                setProfileMessage("");
                setProfileOpen(true);
              }}
              aria-label="Open admin profile"
              title="Open admin profile"
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-[#E6E2F2] text-xs font-extrabold text-[#7067AD]">{initials}</span>
              <span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-xs font-bold">{user.name}</span><span className="text-[10px] text-black/40">Profile</span></span>
            </button>
            <button onClick={() => setSignOutConfirmOpen(true)} disabled={signingOut} className="rounded-xl border border-black/[.07] bg-white px-3 py-2 text-xs font-bold text-black/55 transition hover:text-black disabled:opacity-50">Sign out</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#756FB8]">Platform administration</p>
              <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{active === "User Management" && showArchives ? "Archives" : active}</h1>
              <p className="mt-2 text-sm text-black/45">
                {active === "Overview" ? "A quick snapshot of activity across Gatherly." : active === "User Management" ? showArchives ? "View and restore disabled accounts." : "View and manage admin and organizer accounts." : active === "Events Management" ? "Review events across all organizer accounts." : "Monitor activity and performance across Gatherly."}
              </p>
            </div>
            {active === "User Management" && (
              <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:translate-x-[15px] sm:flex-row sm:items-center">
                <label className="relative w-full sm:w-64 lg:w-72">
                  <span className="sr-only">Search {showArchives ? "archived" : "active"} accounts</span>
                  <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-black/[.07] bg-white px-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#756FB8]/50 focus:ring-4 focus:ring-[#756FB8]/10" placeholder={showArchives ? "Search archives..." : "Search accounts..."} />
                </label>
                <button type="button" onClick={() => { setShowArchives((current) => !current); setSearch(""); setPage(1); }} className="h-11 shrink-0 rounded-xl border border-black/[.08] bg-white px-4 text-xs font-bold text-[#2D3142] hover:bg-[#F8F6F3]">{showArchives ? "Back to users" : "Archives"}</button>
                {!showArchives && <button type="button" onClick={() => { setCreateUserError(""); setCreateUserOpen(true); }} className="h-11 shrink-0 rounded-xl bg-[#756FB8] px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(114,87,245,.18)] hover:bg-[#625CA4]">Create User</button>}
              </div>
            )}
            {active === "Events Management" && (
              <label className="relative w-full sm:ml-auto sm:w-64 lg:w-72">
                <span className="sr-only">Search events</span>
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-black/[.07] bg-white px-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#756FB8]/50 focus:ring-4 focus:ring-[#756FB8]/10" placeholder="Search events..." />
              </label>
            )}
            {["Analytics", "User Management", "Events Management"].includes(active) && (
              <div className="relative">
                <button
                  type="button"
                  disabled={loading || Boolean(error) || (active === "Analytics" && (!selectedAccountActivity || !selectedTicketActivity || analyticsExporting))}
                  aria-haspopup="menu"
                  aria-expanded={analyticsExportMenuOpen}
                  onClick={() => setAnalyticsExportMenuOpen((open) => !open)}
                  className="h-11 shrink-0 rounded-xl bg-[#756FB8] px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(114,87,245,.18)] transition hover:bg-[#625CA4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyticsExporting ? "Generating report…" : "Export"}
                </button>
                {analyticsExportMenuOpen && (
                  <div role="menu"                   aria-label={`Export ${active === "User Management" ? (showArchives ? "archived accounts" : "users") : active.toLowerCase()}`} className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-xl border border-black/[.08] bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleTableExport("csv")}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleTableExport("xls")}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]"
                    >
                      Export Excel (.xls)
                    </button>
                    {active !== "Analytics" && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleTableExport("pdf")}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]"
                      >
                        Export PDF
                      </button>
                    )}
                    {active === "Analytics" && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={analyticsExporting}
                      onClick={async () => {
                        setAnalyticsExportMenuOpen(false);
                        setAnalyticsExportError("");
                        setAnalyticsExporting(true);
                        try {
                          const report = await workspaceApi({
                            path: "/analytics-report",
                            method: "POST",
                            body: JSON.stringify({
                              accountCreations: {
                                period: accountCreationPeriod,
                                range: accountCreationRangeLabel,
                                buckets: accountCreationBuckets.map(({ label, value }) => ({ label, value })),
                              },
                              ticketSales: {
                                period: ticketSalesPeriod,
                                range: ticketSalesRangeLabel,
                                buckets: ticketSalesBuckets.map(({ label, value }) => ({ label, value })),
                              },
                              metrics: {
                                accountsCreated: selectedAccountActivity.totalAccountsCreated,
                                archivedAccounts: selectedAccountActivity.totalArchivedAccounts,
                                ticketsSold: selectedTicketActivity.totalTicketsSold,
                                checkInRate: selectedTicketActivity.totalAttendees
                                  ? Math.round((selectedTicketActivity.checkedInAttendees / selectedTicketActivity.totalAttendees) * 100)
                                  : 0,
                                totalUsers: analytics.totalUsers,
                                totalEvents: analytics.totalEvents,
                                totalAttendees: analytics.totalAttendees,
                                processingFeeRevenue: analytics.totalRevenue,
                              },
                              breakdowns: {
                                eventStatuses: Object.fromEntries(
                                  ["On sale", "Draft", "Finished", "Cancelled"].map((status) => [status, analytics.eventStatuses[status] || 0]),
                                ),
                                discoverySources: analytics.discoverySources.map(({ count }) => ({ label: "Attendee discovery source", count })),
                              },
                            }),
                          });
                          downloadAnalyticsPdf({
                            accountCreationRangeLabel,
                            accountCreationBuckets,
                            accountCreationPeriod,
                            ticketSalesRangeLabel,
                            ticketSalesBuckets,
                            ticketSalesPeriod,
                            analytics,
                            report: {
                              ...report,
                              metrics: {
                                accountsCreated: selectedAccountActivity.totalAccountsCreated,
                                archivedAccounts: selectedAccountActivity.totalArchivedAccounts,
                                ticketsSold: selectedTicketActivity.totalTicketsSold,
                                checkInRate: selectedTicketActivity.totalAttendees
                                  ? Math.round((selectedTicketActivity.checkedInAttendees / selectedTicketActivity.totalAttendees) * 100)
                                  : 0,
                              },
                            },
                          });
                        } catch (exportError) {
                          setAnalyticsExportError(`Could not export analytics PDF: ${exportError.message}`);
                        } finally {
                          setAnalyticsExporting(false);
                        }
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3] disabled:opacity-50"
                    >
                      Export AI PDF
                    </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {signOutError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{signOutError}</p>}
          {analyticsExportError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{analyticsExportError}</p>}
          {workspaceNotice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{workspaceNotice}<button type="button" onClick={() => setWorkspaceNotice("")} className="ml-3 font-bold underline">Dismiss</button></p>}
          {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700"><p className="font-bold">Admin workspace could not be loaded.</p><p className="mt-1">{error}</p></div>}
          {loading && !error && <p role="status" className="rounded-2xl bg-white p-6 text-sm font-semibold text-black/50">Loading admin workspace…</p>}

          {!loading && !error && active === "Overview" && analytics && (
            <div className="space-y-6">
              <section aria-label="Platform snapshot" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total users" value={analytics.totalUsers.toLocaleString("en-PH")} detail="Organizer accounts" icon="users" />
                <StatCard label="Total events" value={analytics.totalEvents.toLocaleString("en-PH")} detail={`${analytics.activeEvents.toLocaleString("en-PH")} currently on sale`} icon="calendar" />
                <StatCard label="Total attendees" value={analytics.totalAttendees.toLocaleString("en-PH")} detail={`${analytics.checkedInAttendees.toLocaleString("en-PH")} checked in`} icon="users" />
                <StatCard label="Processing fee revenue" value={currency.format(analytics.totalRevenue)} detail={`${analytics.paidOrders.toLocaleString("en-PH")} paid orders`} icon="chart" />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-black/[.055] bg-white p-6">
                  <h2 className="text-lg font-extrabold">Event status</h2>
                  <p className="mt-1 text-xs text-black/40">Current status of platform events.</p>
                  <ul className="mt-5 space-y-4">
                    {["On sale", "Draft", "Finished", "Cancelled"].map((status) => {
                      const count = analytics.eventStatuses[status] || 0;
                      const percentage = analytics.totalEvents ? (count / analytics.totalEvents) * 100 : 0;
                      return <li key={status}>
                        <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-black/60">{status}</span><span className="font-bold">{count.toLocaleString("en-PH")}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-black/[.05]"><div className="h-full rounded-full bg-[#756FB8]" style={{ width: `${percentage}%` }} /></div>
                      </li>;
                    })}
                  </ul>
                </article>

                <article className="rounded-2xl border border-black/[.055] bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-extrabold">Recent events</h2>
                      <p className="mt-1 text-xs text-black/40">Latest events added to Gatherly.</p>
                    </div>
                    <button type="button" onClick={() => setActive("Events Management")} className="shrink-0 rounded-lg border border-black/[.08] px-3 py-2 text-xs font-bold text-[#756FB8] hover:bg-[#F8F6F3]">View all</button>
                  </div>
                  {events.length > 0 ? (
                    <ul className="mt-4 divide-y divide-black/[.05]">
                      {events.slice(0, 5).map((event) => (
                        <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{event.name || "Untitled event"}</p>
                            <p className="mt-1 truncate text-xs text-black/40">{event.organizerName || "Unknown organizer"} · {formatDate(event.date)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${event.status === "On sale" ? "bg-emerald-50 text-emerald-700" : "bg-black/[.05] text-black/50"}`}>{event.status || "Unknown"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-5 text-sm text-black/40">No events have been created yet.</p>}
                </article>
              </section>

            </div>
          )}

          {!loading && !error && active === "Analytics" && analytics && (
            <>
              <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total users" value={analytics.totalUsers.toLocaleString("en-PH")} detail="Organizer accounts" icon="users" />
                <StatCard label="Total events" value={analytics.totalEvents.toLocaleString("en-PH")} detail={`${analytics.activeEvents.toLocaleString("en-PH")} currently on sale`} icon="calendar" />
                <StatCard label="Total attendees" value={analytics.totalAttendees.toLocaleString("en-PH")} detail={`${analytics.checkedInAttendees.toLocaleString("en-PH")} checked in`} icon="users" />
                <article className="relative rounded-2xl border border-black/[.055] bg-white p-5 shadow-[0_2px_10px_rgba(20,18,26,.025)]">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#E9E5F3] text-[#756FB8]"><AdminIcon name="chart" /></div>
                  <button type="button" onClick={() => { setProcessingFeeInput((analytics.processingFeeCents / 100).toFixed(2)); setProcessingFeeError(""); setProcessingFeeModalOpen(true); }} aria-label="Adjust processing fee" title="Adjust processing fee" className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-[#E9E5F3] text-[#756FB8] transition hover:bg-[#DDD7EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#756FB8]">
                    <AdminIcon name="settings" className="size-5" />
                  </button>
                  <p className="mt-5 text-xs font-semibold text-black/40">Processing fee revenue</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">{currency.format(analytics.totalRevenue)}</p>
                  <p className="mt-1 text-[11px] text-black/40">{currency.format(analytics.processingFeeCents / 100)} per paid ticket · {analytics.paidOrders.toLocaleString("en-PH")} paid orders</p>
                </article>
              </section>
              <section aria-labelledby="admin-account-creations-title" className="mt-6 rounded-2xl border border-black/[.055] bg-white p-5 shadow-[0_2px_10px_rgba(20,18,26,.025)] sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id="admin-account-creations-title" className="text-lg font-extrabold">Account creations over time</h2>
                    <p className="mt-1 text-xs text-black/40">Organizer accounts created across Gatherly · {accountCreationRangeLabel}</p>
                  </div>
                  <AnalyticsFilters
                    period={accountCreationPeriod}
                    date={accountCreationDate}
                    maxDate={currentAnalyticsDate}
                    maxMonth={currentAnalyticsMonth}
                    onDateChange={setAccountCreationDate}
                    onPeriodChange={setAccountCreationPeriod}
                    idPrefix="Account creations"
                  />
                </div>
                {selectedAccountActivityError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{selectedAccountActivityError}</p>}
                <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
                  <div className="min-w-0">
                    {!selectedAccountActivity && !selectedAccountActivityError && <p role="status" className="rounded-xl bg-[#F8F6F3] p-4 text-xs text-black/45">Loading account activity…</p>}
                    {selectedAccountActivity && <TrendChart title="Account creations over time" metric="Accounts created" buckets={accountCreationBuckets} period={accountCreationPeriod} />}
                  </div>
                  <div className="grid content-center gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <article className="w-full max-w-[220px] justify-self-center rounded-xl border border-black/[.055] bg-white p-5 text-center">
                      <p className="text-xs font-semibold text-black/45">Accounts created</p>
                      <p className="mt-2 text-2xl font-extrabold">{selectedAccountActivity ? selectedAccountActivity.totalAccountsCreated.toLocaleString("en-PH") : "—"}</p>
                    </article>
                    <article className="w-full max-w-[220px] justify-self-center rounded-xl border border-black/[.055] bg-white p-5 text-center">
                      <p className="text-xs font-semibold text-black/45">Archived accounts</p>
                      <p className="mt-2 text-2xl font-extrabold">{selectedAccountActivity ? selectedAccountActivity.totalArchivedAccounts.toLocaleString("en-PH") : "—"}</p>
                    </article>
                  </div>
                </div>
              </section>
              <section aria-labelledby="admin-ticket-sales-title" className="mt-4 rounded-2xl border border-black/[.055] bg-white p-5 shadow-[0_2px_10px_rgba(20,18,26,.025)] sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id="admin-ticket-sales-title" className="text-lg font-extrabold">Ticket sales over time</h2>
                    <p className="mt-1 text-xs text-black/40">Tickets registered across all Gatherly · {ticketSalesRangeLabel}</p>
                  </div>
                  <AnalyticsFilters
                    period={ticketSalesPeriod}
                    date={ticketSalesDate}
                    maxDate={currentAnalyticsDate}
                    maxMonth={currentAnalyticsMonth}
                    onDateChange={setTicketSalesDate}
                    onPeriodChange={setTicketSalesPeriod}
                    idPrefix="Ticket sales"
                  />
                </div>
                {selectedActivityError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{selectedActivityError}</p>}
                <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
                  <div className="min-w-0">
                    {!selectedTicketActivity && !selectedActivityError && <p role="status" className="rounded-xl bg-[#F8F6F3] p-4 text-xs text-black/45">Loading ticket sales…</p>}
                    {selectedTicketActivity && <TrendChart title="Ticket sales over time" metric="Tickets sold" buckets={ticketSalesBuckets} period={ticketSalesPeriod} />}
                  </div>
                  <div className="grid content-center gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <article className="w-full max-w-[220px] justify-self-center rounded-xl border border-black/[.055] bg-white p-5 text-center">
                      <p className="text-xs font-semibold text-black/45">Tickets sold</p>
                      <p className="mt-2 text-2xl font-extrabold">{selectedTicketActivity ? selectedTicketActivity.totalTicketsSold.toLocaleString("en-PH") : "—"}</p>
                    </article>
                    <article className="w-full max-w-[220px] justify-self-center rounded-xl border border-black/[.055] bg-white p-5 text-center">
                      <p className="text-xs font-semibold text-black/45">Check-in rate</p>
                      <p className="mt-2 text-2xl font-extrabold">{selectedTicketActivity ? `${selectedTicketActivity.totalAttendees ? Math.round((selectedTicketActivity.checkedInAttendees / selectedTicketActivity.totalAttendees) * 100) : 0}%` : "—"}</p>
                    </article>
                  </div>
                </div>
              </section>
              <section className="mt-6 grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-black/[.055] bg-white p-6">
                  <h2 className="text-lg font-extrabold">Event status</h2>
                  <p className="mt-1 text-xs text-black/40">All events created on Gatherly.</p>
                  <ul className="mt-5 space-y-4">
                    {["On sale", "Draft", "Finished", "Cancelled"].map((status) => {
                      const count = analytics.eventStatuses[status] || 0;
                      const percentage = analytics.totalEvents ? (count / analytics.totalEvents) * 100 : 0;
                      return <li key={status}>
                        <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-black/60">{status}</span><span className="font-bold">{count.toLocaleString("en-PH")}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-black/[.05]"><div className="h-full rounded-full bg-[#756FB8]" style={{ width: `${percentage}%` }} /></div>
                      </li>;
                    })}
                  </ul>
                </article>
                <article aria-labelledby="admin-discovery-source-title" className="rounded-2xl border border-black/[.055] bg-white p-6">
                  <h2 id="admin-discovery-source-title" className="text-lg font-extrabold">Where Attendees Heard About Events</h2>
                  <p className="mt-1 text-xs text-black/40">Registration sources across all Gatherly events.</p>
                  {analytics.discoverySources.length > 0 ? (
                    <ol aria-label="Platform attendee discovery sources" className="mt-5 space-y-4">
                      {analytics.discoverySources.map((source) => {
                        const percentage = analytics.totalAttendees
                          ? Math.round((source.count / analytics.totalAttendees) * 100)
                          : 0;
                        const maximum = analytics.discoverySources[0].count;
                        return (
                          <li key={source.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-xs">
                            <span className="truncate font-semibold text-black/65" title={source.label}>{source.label}</span>
                            <span className="font-bold tabular-nums">{source.count.toLocaleString("en-PH")} <span className="font-normal text-black/40">· {percentage}%</span></span>
                            <div role="img" aria-label={`${source.label}: ${source.count} attendee${source.count === 1 ? "" : "s"}`} className="col-span-2 h-3 overflow-hidden rounded-full bg-black/[.05]">
                              <div className="h-full rounded-full bg-[#756FB8] transition-all" style={{ width: `${(source.count / maximum) * 100}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : <p className="mt-5 text-sm text-black/40">No attendee discovery sources have been recorded yet.</p>}
                </article>
              </section>
            </>
          )}

          {!loading && !error && active === "User Management" && (
            <section className="overflow-hidden rounded-2xl border border-black/[.055] bg-white shadow-[0_2px_10px_rgba(20,18,26,.025)]">
              <div className="border-b border-black/[.06] p-5 sm:px-6"><h2 className="text-lg font-extrabold">{showArchives ? "Archived accounts" : "Accounts"}</h2><p className="mt-1 text-xs text-black/40">Showing {filteredUsers.length.toLocaleString("en-PH")} {showArchives ? "archived " : ""}account{filteredUsers.length === 1 ? "" : "s"}</p></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead><tr className="border-b border-black/[.05] text-[10px] font-bold uppercase tracking-[.12em] text-black/35"><th className="px-6 py-4">Name</th><th className="px-4 py-4">Email</th><th className="px-4 py-3"><label className="sr-only" htmlFor="user-role-filter">Filter accounts by role</label><select id="user-role-filter" aria-label="Filter accounts by role" value={userRoleFilter} onChange={(event) => { setUserRoleFilter(event.target.value); setPage(1); }} className="max-w-full rounded-lg border border-black/[.08] bg-white px-2 py-2 text-[10px] font-bold uppercase tracking-[.08em] text-black/45 outline-none focus:border-[#756FB8]/50 focus:ring-2 focus:ring-[#756FB8]/10"><option value="all">All Roles</option><option value="organizers">Organizers</option><option value="admins">Admins</option></select></th><th className="px-4 py-4">Joined</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                  <tbody>{paginatedUsers.map((account) => (
                    <tr key={account.id} className="border-b border-black/[.045] last:border-0 hover:bg-[#F9F7F5]">
                      <td className="px-6 py-4 text-sm font-bold">{account.name}</td>
                      <td className="px-4 py-4 text-xs text-black/55">{account.email}</td>
                      <td className="px-4 py-4 text-xs font-semibold text-black/55">{account.accountType === "admin" ? "Admin" : "Organizer"}</td>
                      <td className="px-4 py-4 text-xs text-black/55">{formatDate(account.createdAt)}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${account.disabledAt || account.archivedAt ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{account.disabledAt || account.archivedAt ? "Disabled" : "Active"}</span></td>
                      <td className="px-6 py-4"><div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setAccountActionError(""); setViewingAccount(account); }} className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-[11px] font-bold text-[#756FB8] hover:bg-[#F4F1FA]">View</button>
                        <button type="button" onClick={() => { setAccountActionError(""); setPendingAccountAction({ account, value: !account.disabledAt && !account.archivedAt }); }} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${account.disabledAt || account.archivedAt ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50" : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"}`}>{account.disabledAt || account.archivedAt ? "Enable" : "Disable"}</button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && <p className="px-6 py-12 text-center text-sm text-black/45">{showArchives ? "No archived accounts match your search." : "No accounts match your search."}</p>}
              <AdminPagination itemCount={filteredUsers.length} page={currentPage} onPageChange={setPage} pageSize={pageSize} />
            </section>
          )}

          {!loading && !error && active === "Events Management" && (
            <section className="overflow-hidden rounded-2xl border border-black/[.055] bg-white shadow-[0_2px_10px_rgba(20,18,26,.025)]">
              <div className="border-b border-black/[.06] p-5 sm:px-6"><h2 className="text-lg font-extrabold">Events management</h2><p className="mt-1 text-xs text-black/40">{filteredEvents.length.toLocaleString("en-PH")} event{filteredEvents.length === 1 ? "" : "s"}</p></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead><tr className="border-b border-black/[.05] text-[10px] font-bold uppercase tracking-[.12em] text-black/35"><th className="px-6 py-4">Event</th><th className="px-4 py-4">Organizer</th><th className="px-4 py-4">Date</th><th className="px-4 py-4">Tickets</th><th className="px-6 py-4">Status</th></tr></thead>
                  <tbody>{paginatedEvents.map((event) => (
                    <tr key={event.id} className="border-b border-black/[.045] last:border-0 hover:bg-[#F9F7F5]">
                      <td className="px-6 py-4"><p className="text-sm font-bold">{event.name || "Untitled event"}</p><p className="mt-1 text-[10px] text-[#756FB8]">{event.eventCode || "No event code"}</p></td>
                      <td className="px-4 py-4"><p className="text-xs font-semibold">{event.organizerName}</p><p className="mt-1 text-[10px] text-black/40">{event.organizerEmail || "—"}</p></td>
                      <td className="px-4 py-4 text-xs text-black/55">{formatDate(event.date)}</td>
                      <td className="px-4 py-4 text-xs font-semibold text-black/55">{Number(event.sold || 0).toLocaleString("en-PH")} / {Number(event.total || 0).toLocaleString("en-PH")}</td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${event.status === "On sale" ? "bg-emerald-50 text-emerald-700" : "bg-black/[.05] text-black/50"}`}>{event.status || "Unknown"}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {filteredEvents.length === 0 && <p className="px-6 py-12 text-center text-sm text-black/45">No events match your search.</p>}
              <AdminPagination itemCount={filteredEvents.length} page={currentPage} onPageChange={setPage} pageSize={pageSize} />
            </section>
          )}

          {viewingAccount && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingAccount(null); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="account-details-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#756FB8]">{viewingAccount.accountType === "admin" ? "Admin account" : "Organizer account"}</p><h2 id="account-details-title" className="mt-2 text-xl font-extrabold">{viewingAccount.name}</h2></div>
                  <button type="button" onClick={() => setViewingAccount(null)} className="rounded-lg px-3 py-2 text-sm font-bold text-black/45 hover:bg-black/[.05]" aria-label="Close account details">×</button>
                </div>
                <dl className="mt-6 divide-y divide-black/[.06] rounded-xl border border-black/[.06] px-4">
                  <div className="grid grid-cols-[120px_1fr] gap-3 py-3 text-sm"><dt className="text-black/45">Email</dt><dd className="break-all font-semibold">{viewingAccount.email}</dd></div>
                  <div className="grid grid-cols-[120px_1fr] gap-3 py-3 text-sm"><dt className="text-black/45">Joined</dt><dd className="font-semibold">{formatDate(viewingAccount.createdAt)}</dd></div>
                  <div className="grid grid-cols-[120px_1fr] gap-3 py-3 text-sm"><dt className="text-black/45">Status</dt><dd className="font-semibold">{viewingAccount.disabledAt || viewingAccount.archivedAt ? `Disabled ${formatDate(viewingAccount.disabledAt || viewingAccount.archivedAt)}` : "Active"}</dd></div>
                </dl>
                <div className="mt-6 flex justify-end"><button type="button" onClick={() => setViewingAccount(null)} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#625CA4]">Close</button></div>
              </section>
            </div>
          )}

          {createUserOpen && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !createUserLoading) setCreateUserOpen(false); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="create-user-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#756FB8]">User Management</p><h2 id="create-user-title" className="mt-2 text-xl font-extrabold">Create account</h2></div>
                  <button type="button" disabled={createUserLoading} onClick={() => setCreateUserOpen(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-black/45 hover:bg-black/[.05]" aria-label="Close create user form">×</button>
                </div>
                <p className="mt-3 text-sm leading-6 text-black/55">We’ll email a temporary password to the new account. They’ll be asked to change it when they first sign in. Admin accounts can access the admin workspace.</p>
                <form onSubmit={createUser} className="mt-5 space-y-4">
                  <label className="block"><span className="mb-2 block text-xs font-bold">Full name</span><input required maxLength={100} autoComplete="name" value={newUserName} onChange={(event) => setNewUserName(event.target.value)} className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-xs font-bold">Email address</span><input required type="email" maxLength={254} autoComplete="email" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
                    <label className="block"><span className="mb-2 block text-xs font-bold">Role</span><select required value={newUserRole} onChange={(event) => setNewUserRole(event.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-[#756FB8]"><option value="organizer">Organizer</option><option value="admin">Admin</option></select></label>
                  </div>
                  {createUserError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{createUserError}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" disabled={createUserLoading} onClick={() => setCreateUserOpen(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-black/55 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={createUserLoading} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#625CA4] disabled:opacity-50">{createUserLoading ? "Creating and sending email…" : "Create User"}</button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {pendingAccountAction && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !accountActionLoading) setPendingAccountAction(null); }}>
              <section role="alertdialog" aria-modal="true" aria-labelledby="account-action-title" aria-describedby="account-action-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#756FB8]">Customer account</p>
                <h2 id="account-action-title" className="mt-2 text-xl font-extrabold">
                  {pendingAccountAction.value ? "Disable this account?" : "Enable this account?"}
                </h2>
                <p id="account-action-description" className="mt-3 text-sm leading-6 text-black/55">
                  {pendingAccountAction.value
                    ? `${pendingAccountAction.account.name} will lose access to existing sessions, will no longer be able to sign in, and will move to Archives.`
                    : `${pendingAccountAction.account.name} will be able to sign in and use Gatherly again, and will return to User Management.`}
                </p>
                {accountActionError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{accountActionError}</p>}
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" disabled={accountActionLoading} onClick={() => setPendingAccountAction(null)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-black/55 disabled:opacity-50">Cancel</button>
                  <button type="button" disabled={accountActionLoading} onClick={confirmAccountAction} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${pendingAccountAction.value ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-700 hover:bg-emerald-800"}`}>
                    {accountActionLoading ? "Saving…" : pendingAccountAction.value ? "Disable account" : "Enable account"}
                  </button>
                </div>
              </section>
            </div>
          )}
          {profileOpen && (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-[#2D3142]/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !profileSaving) setProfileOpen(false); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
                <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.15em] text-[#756FB8]">Admin workspace</p>
                    <h2 id="admin-profile-title" className="mt-2 text-2xl font-extrabold tracking-tight">Your profile</h2>
                    <p className="mt-2 text-xs leading-5 text-black/45">Your Gatherly account details.</p>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    <button type="button" disabled={profileSaving} onClick={() => { setProfileAction("edit"); setProfileName(user.name); setProfileError(""); setProfileMessage(""); }} className="rounded-xl border border-[#756FB8]/25 px-3 py-2 text-xs font-bold text-[#625CA4] transition hover:bg-[#E7E6F2] disabled:opacity-50">Edit profile</button>
                    <button type="button" disabled={profileSaving} onClick={() => { setProfileAction("password"); setProfileCurrentPassword(""); setProfileCurrentPasswordCheck({ state: "empty", value: "", message: "" }); setProfileNewPassword(""); setProfileNewPasswordCheck({ state: "empty", value: "", message: "" }); setProfileConfirmPassword(""); setProfilePasswordVisibility({ current: false, new: false, confirm: false }); setProfileError(""); setProfileMessage(""); }} className="rounded-xl bg-[#756FB8] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#625CA4] disabled:opacity-50">Change password</button>
                    <button type="button" disabled={profileSaving} onClick={() => setProfileOpen(false)} className="rounded-xl bg-black/[.04] p-2 text-black/50 transition hover:bg-black/[.08] disabled:opacity-50" aria-label="Close profile"><AdminIcon name="close" /></button>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-[.8fr_1.2fr]">
                  <article className="rounded-2xl bg-[#333746] p-6 text-white">
                    <div className="grid size-16 place-items-center rounded-2xl bg-[#F4DFA6] text-xl font-extrabold text-[#2D3142]">{initials}</div>
                    <h3 className="mt-5 text-lg font-extrabold">{user.name}</h3>
                    <p className="mt-1 break-all text-xs text-white/55">{user.email}</p>
                    <div className="mt-5 rounded-xl bg-white/[.07] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40">Account type</p>
                      <p className="mt-2 text-sm font-bold">Administrator</p>
                    </div>
                  </article>
                  <div className="rounded-2xl border border-black/[.06] p-6">
                    {profileAction === "edit" ? <form onSubmit={saveProfileName}>
                      <h3 className="text-sm font-extrabold">Edit profile</h3>
                      <label className="mt-5 block">
                        <span className="mb-2 block text-[11px] font-semibold text-black/45">Full name</span>
                        <input value={profileName} onChange={(event) => setProfileName(event.target.value)} required maxLength={100} autoComplete="name" className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#756FB8]" />
                      </label>
                      <div className="mt-4"><p className="text-[11px] font-semibold text-black/40">Email address</p><p className="mt-1 break-all text-sm font-bold">{user.email}</p></div>
                      <p className="mt-5 rounded-xl bg-[#F8F6F3] p-4 text-xs leading-5 text-black/50">Your email is used to sign in and cannot be changed here.</p>
                      {profileError && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{profileError}</p>}
                      <div className="mt-5 flex justify-end gap-2">
                        <button type="button" disabled={profileSaving} onClick={() => { setProfileAction(""); setProfileError(""); }} className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-black/60 transition hover:bg-black/[.03] disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={profileSaving || profileName.trim() === user.name} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#625CA4] disabled:cursor-not-allowed disabled:opacity-50">{profileSaving ? "Saving..." : "Save changes"}</button>
                      </div>
                    </form> : profileAction === "password" ? <form onSubmit={changeProfilePassword}>
                      <h3 className="text-sm font-extrabold">Change password</h3>
                      <div className="mt-5 space-y-4">
                        {[
                          ["current", "Current password", profileCurrentPassword, setProfileCurrentPassword, "current-password"],
                          ["new", "New password", profileNewPassword, setProfileNewPassword, "new-password"],
                          ["confirm", "Confirm new password", profileConfirmPassword, setProfileConfirmPassword, "new-password"],
                        ].map(([key, label, value, setValue, autoComplete]) => <label key={key} className="block">
                          <span className="mb-2 block text-[11px] font-semibold text-black/45">{label}</span>
                          <span className="relative block">
                            <input
                              type={profilePasswordVisibility[key] ? "text" : "password"}
                              value={value}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setValue(nextValue);
                                if (key === "current") {
                                  setProfileCurrentPasswordCheck({
                                    state: nextValue ? "checking" : "empty",
                                    value: nextValue,
                                    message: nextValue ? "Checking current password..." : "",
                                  });
                                } else if (key === "new") {
                                  const meetsRequirements = getPasswordRequirements(nextValue).every(([, met]) => met);
                                  setProfileNewPasswordCheck({
                                    state: !nextValue ? "empty" : meetsRequirements ? "checking" : "incomplete",
                                    value: nextValue,
                                    message: !nextValue
                                      ? ""
                                      : meetsRequirements
                                        ? "Checking against your current password..."
                                        : "Complete the password requirements to check it.",
                                  });
                                }
                              }}
                              required
                              {...(key === "new" ? { minLength: 8, maxLength: 128 } : {})}
                              autoComplete={autoComplete}
                              className="h-11 w-full rounded-xl border border-black/10 px-3 pr-11 text-sm outline-none focus:border-[#756FB8]"
                            />
                            <button type="button" onClick={() => setProfilePasswordVisibility((current) => ({ ...current, [key]: !current[key] }))} aria-label={`${profilePasswordVisibility[key] ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={profilePasswordVisibility[key]} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-black/40 transition hover:text-[#625CA4]"><AdminIcon name={profilePasswordVisibility[key] ? "eyeOff" : "eye"} className="size-[18px]" /></button>
                          </span>
                          {key === "current" && profileCurrentPasswordCheck.value === profileCurrentPassword && profileCurrentPasswordCheck.message && <span
                            role={profileCurrentPasswordCheck.state === "invalid" || profileCurrentPasswordCheck.state === "error" ? "alert" : "status"}
                            className={`mt-1.5 block text-[11px] font-semibold ${profileCurrentPasswordCheck.state === "valid" ? "text-emerald-700" : profileCurrentPasswordCheck.state === "checking" ? "text-black/40" : "text-rose-600"}`}
                          >
                            {profileCurrentPasswordCheck.message}
                          </span>}
                          {key === "confirm" && profileConfirmPassword && <span role={profileNewPassword === profileConfirmPassword ? "status" : "alert"} className={`mt-1.5 block text-[11px] font-semibold ${profileNewPassword === profileConfirmPassword ? "text-emerald-700" : "text-rose-600"}`}>{profileNewPassword === profileConfirmPassword ? "Passwords match." : "Passwords do not match."}</span>}
                        </label>)}
                      </div>
                      {profileNewPasswordCheck.value === profileNewPassword && profileNewPasswordCheck.message && <p
                        role={profileNewPasswordCheck.state === "same" || profileNewPasswordCheck.state === "error" ? "alert" : "status"}
                        className={`mt-2 text-[11px] font-semibold ${profileNewPasswordCheck.state === "different" ? "text-emerald-700" : profileNewPasswordCheck.state === "checking" || profileNewPasswordCheck.state === "incomplete" ? "text-black/40" : "text-rose-600"}`}
                      >
                        {profileNewPasswordCheck.message}
                      </p>}
                      <ul className="mt-3 space-y-1 text-[11px]" aria-label="Password requirements">
                        {getPasswordRequirements(profileNewPassword).map(([requirement, met]) => <li key={requirement} className={met ? "font-semibold text-emerald-700" : "text-black/45"}>{met ? "✓" : "○"} {requirement}</li>)}
                      </ul>
                      {profileError && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{profileError}</p>}
                      <div className="mt-5 flex justify-end gap-2">
                        <button type="button" disabled={profileSaving} onClick={() => { setProfileAction(""); setProfileError(""); }} className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-black/60 transition hover:bg-black/[.03] disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={profileSaving || profileCurrentPasswordCheck.state !== "valid" || profileCurrentPasswordCheck.value !== profileCurrentPassword || profileNewPasswordCheck.state !== "different" || profileNewPasswordCheck.value !== profileNewPassword || !profileConfirmPassword || profileNewPassword !== profileConfirmPassword} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#625CA4] disabled:cursor-not-allowed disabled:opacity-50">{profileSaving ? "Updating..." : "Update password"}</button>
                      </div>
                    </form> : <>
                      <h3 className="text-sm font-extrabold">Account information</h3>
                      <dl className="mt-5 space-y-4">
                        <div><dt className="text-[11px] font-semibold text-black/40">Full name</dt><dd className="mt-1 text-sm font-bold">{user.name}</dd></div>
                        <div><dt className="text-[11px] font-semibold text-black/40">Email address</dt><dd className="mt-1 break-all text-sm font-bold">{user.email}</dd></div>
                      </dl>
                      <p className="mt-6 rounded-xl bg-[#F8F6F3] p-4 text-xs leading-5 text-black/50">Your email is used to sign in and cannot be changed here.</p>
                      {profileMessage && <p role="status" className="mt-4 text-xs font-semibold text-emerald-700">{profileMessage}</p>}
                    </>}
                  </div>
                </div>
                {profileMessage && profileAction && <p role="status" className="mt-4 text-xs font-semibold text-emerald-700">{profileMessage}</p>}
              </section>
            </div>
          )}
          {signOutConfirmOpen && (
            <div
              className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
              onMouseDown={(event) => { if (event.target === event.currentTarget && !signingOut) setSignOutConfirmOpen(false); }}
              onKeyDown={(event) => { if (event.key === "Escape" && !signingOut) setSignOutConfirmOpen(false); }}
            >
              <section role="alertdialog" aria-modal="true" aria-labelledby="admin-signout-title" aria-describedby="admin-signout-description" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h2 id="admin-signout-title" className="text-xl font-extrabold">Log out of Gatherly?</h2>
                <p id="admin-signout-description" className="mt-3 text-sm leading-6 text-black/55">You’ll need to sign in again to access the admin workspace.</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" disabled={signingOut} onClick={() => setSignOutConfirmOpen(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-black/55 disabled:opacity-50">Cancel</button>
                  <button type="button" disabled={signingOut} onClick={handleSignOut} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#625CA4] disabled:opacity-50">{signingOut ? "Signing out…" : "Log out"}</button>
                </div>
              </section>
            </div>
          )}
          {processingFeeModalOpen && (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !processingFeeSaving) setProcessingFeeModalOpen(false); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="processing-fee-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#756FB8]">Platform settings</p>
                <h2 id="processing-fee-title" className="mt-2 text-xl font-extrabold">Adjust processing fee</h2>
                <p className="mt-2 text-sm leading-6 text-black/55">This fee is charged per paid ticket. Free registrations are not charged. The new fee only applies to future registrations.</p>
                <form onSubmit={requestProcessingFeeSave} className="mt-5">
                  <label className="block"><span className="mb-2 block text-xs font-bold">Processing fee (PHP)</span><input required type="number" min="0" step="0.01" inputMode="decimal" value={processingFeeInput} onChange={(event) => setProcessingFeeInput(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
                  {processingFeeError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{processingFeeError}</p>}
                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" disabled={processingFeeSaving} onClick={() => setProcessingFeeModalOpen(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-black/55 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={processingFeeSaving} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#625CA4] disabled:opacity-50">Save fee</button>
                  </div>
                </form>
              </section>
            </div>
          )}
          {processingFeeConfirmation !== null && (
            <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !processingFeeSaving) setProcessingFeeConfirmation(null); }}>
              <section role="alertdialog" aria-modal="true" aria-labelledby="processing-fee-confirm-title" aria-describedby="processing-fee-confirm-description" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h2 id="processing-fee-confirm-title" className="text-xl font-extrabold">Confirm processing fee change?</h2>
                <p id="processing-fee-confirm-description" className="mt-3 text-sm leading-6 text-black/55">Set Gatherly’s fee to <strong className="text-[#2D3142]">{currency.format(processingFeeConfirmation / 100)}</strong> per paid ticket? This applies to future registrations only.</p>
                {processingFeeError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{processingFeeError}</p>}
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" disabled={processingFeeSaving} onClick={() => setProcessingFeeConfirmation(null)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-black/55 disabled:opacity-50">Cancel</button>
                  <button type="button" disabled={processingFeeSaving} onClick={confirmProcessingFeeSave} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#625CA4] disabled:opacity-50">{processingFeeSaving ? "Saving…" : "Confirm and save"}</button>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
