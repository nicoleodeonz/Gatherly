import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import AdminDashboard from "./AdminDashboard.jsx";
import PublicEventPage from "./PublicEventPage.jsx";

function Icon({ name, className = "size-5" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><path d="M7 2v3M17 2v3M3.5 9h17" /><rect x="3.5" y="4" width="17" height="17" rx="2.5" /></>,
    ticket: <><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" /><path d="M13 7.5v2M13 14.5v2" /></>,
    users: <><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8M22 20v-2a4 4 0 0 0-3-3.87" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.38a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.62 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.62a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" /></>,
    archive: <><path d="M3 4h18v4H3zM5 8v12h14V8M10 12h4" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 3.2 2.4c-.9.35-.9 1.1-.9 1.6M12 17h.01" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16.5 16.5 0 0 1-3.1 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4-.8" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const eventImage = "https://images.unsplash.com/photo-1567779013473-6cbdff716235?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200";

const nav = [
  ["Overview", "grid"],
  ["Events", "calendar"],
  ["Orders", "ticket"],
  ["Attendees", "users"],
  ["Analytics", "chart"],
];

const helpArticles = [
  ["How do I create or update an event?", "Open Events, choose Create event or Edit, update the details, and save. Your changes are saved to your Gatherly workspace."],
  ["Can I refund a ticket order?", "Open Orders and select Refund beside an order. The updated order status is saved to your workspace."],
  ["How does attendee check-in work?", "Open Attendees and select Check in beside a guest. Select it again to undo the check-in."],
  ["Where can I see ticket performance?", "Open Analytics to compare tickets sold with capacity for each event."],
  ["How is workspace information kept private?", "Events, orders, and attendees are loaded and updated for the signed-in account only."],
];

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

function toDateInputValue(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPhilippineDateValue() {
  return getManilaDateValue(new Date());
}

function isEventDateToday(event) {
  const startDate = toDateInputValue(event.date || "");
  const endDate = event.multipleDay && event.endDate
    ? toDateInputValue(event.endDate)
    : startDate;
  const today = getPhilippineDateValue();
  return Boolean(startDate && endDate && startDate <= today && today <= endDate);
}

function hasEventStartDatePassed(event, now) {
  const startDate = toDateInputValue(event.date || "");
  return Boolean(startDate && startDate < getManilaDateValue(new Date(now)));
}

function getEventStartAt(event) {
  const date = toDateInputValue(event.date || "");
  const time = toTimeInputValue(event.time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return new Date(Date.UTC(year, month - 1, day, hours - 8, minutes));
}

function getDaysUntilEvent(event, now) {
  const eventDate = toDateInputValue(event.date || "");
  const today = getPhilippineDateValue(new Date(now));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return null;
  const [eventYear, eventMonth, eventDay] = eventDate.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const eventDayUtc = Date.UTC(eventYear, eventMonth - 1, eventDay);
  const todayDayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((eventDayUtc - todayDayUtc) / 86400000);
}

function getManilaDateValue(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function buildRegistrationGrowth(attendees, period, now) {
  const today = getManilaDateValue(new Date(now));
  const [year, month, day] = today.split("-").map(Number);
  const todayUtc = Date.UTC(year, month - 1, day);
  let buckets;
  let firstWeekStart;
  if (period === "day") {
    buckets = Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour).padStart(2, "0"),
      label: new Intl.DateTimeFormat("en", {
        hour: "numeric",
        hour12: true,
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2024, 0, 1, hour))),
      registrations: 0,
    }));
  } else if (period === "week") {
    const mondayOffset = (new Date(todayUtc).getUTCDay() + 6) % 7;
    firstWeekStart = todayUtc - mondayOffset * 86400000;
    buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(firstWeekStart + index * 86400000);
      return {
        key: date.toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(date),
        registrations: 0,
      };
    });
  } else {
    const firstOfMonth = Date.UTC(year, month - 1, 1);
    const lastOfMonth = Date.UTC(year, month, 0);
    const mondayOffset = (new Date(firstOfMonth).getUTCDay() + 6) % 7;
    firstWeekStart = firstOfMonth - mondayOffset * 86400000;
    buckets = [];
    for (let weekStart = firstWeekStart; weekStart <= lastOfMonth; weekStart += 7 * 86400000) {
      const visibleStart = Math.max(weekStart, firstOfMonth);
      const visibleEnd = Math.min(weekStart + 6 * 86400000, lastOfMonth);
      const startDate = new Date(visibleStart);
      const endDate = new Date(visibleEnd);
      buckets.push({
        key: new Date(weekStart).toISOString().slice(0, 10),
        label: `${startDate.getUTCDate()}–${endDate.getUTCDate()}`,
        registrations: 0,
      });
    }
  }
  const bucketByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  attendees.forEach((attendee) => {
    if (!attendee.createdAt) return;
    const registeredAt = new Date(attendee.createdAt);
    if (Number.isNaN(registeredAt.getTime())) return;
    const registrationDate = getManilaDateValue(registeredAt);
    const bucketKey = period === "day"
      ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", hourCycle: "h23" }).format(registeredAt)
      : period === "week"
        ? registrationDate
        : (() => {
          const [registrationYear, registrationMonth, registrationDay] = registrationDate.split("-").map(Number);
          const registrationUtc = Date.UTC(registrationYear, registrationMonth - 1, registrationDay);
          const weekStart = registrationUtc - ((new Date(registrationUtc).getUTCDay() + 6) % 7) * 86400000;
          return new Date(weekStart).toISOString().slice(0, 10);
        })();
    const bucketIndex = bucketByKey.get(bucketKey);
    if (bucketIndex !== undefined) buckets[bucketIndex].registrations += 1;
  });

  return buckets;
}

function getAnalyticsBucketKey(date, period) {
  const dateInManila = getManilaDateValue(date);
  if (period === "day") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date);
  }
  if (period === "week") return dateInManila;

  const [year, month, day] = dateInManila.split("-").map(Number);
  const utcDay = Date.UTC(year, month - 1, day);
  const weekStart = utcDay - ((new Date(utcDay).getUTCDay() + 6) % 7) * 86400000;
  return new Date(weekStart).toISOString().slice(0, 10);
}

function buildRevenueGrowth(orders, period, now) {
  const buckets = buildRegistrationGrowth([], period, now)
    .map((bucket) => ({ ...bucket, revenue: 0 }));
  const bucketByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  orders.forEach((order) => {
    const paidDate = order.paidAt || order.createdAt;
    if (!paidDate) return;
    const paidAt = new Date(paidDate);
    if (Number.isNaN(paidAt.getTime())) return;
    const bucketIndex = bucketByKey.get(getAnalyticsBucketKey(paidAt, period));
    if (bucketIndex === undefined) return;
    const amount = Number.isFinite(order.amountCents)
      ? order.amountCents / 100
      : Number(String(order.amount || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(amount)) buckets[bucketIndex].revenue += amount;
  });

  return buckets;
}

function escapeExportText(value) {
  return String(value ?? "");
}

function downloadOrganizerBlob(content, mimeType, fileName) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createOrganizerAnalyticsTables({
  selectedAnalyticsEvent,
  revenueAnalyticsPeriod,
  revenueGrowth,
  analyticsPeriod,
  registrationGrowth,
  analyticsEvents,
  analyticsAttendees,
  checkInSummary,
  checkInRate,
  discoverySourceCounts,
}) {
  const eventName = selectedAnalyticsEvent?.name || "All visible published events";
  return [
    {
      name: "Revenue Analytics",
      rows: [
        ["Event scope", eventName],
        ["Grouping", revenueAnalyticsPeriod],
        [],
        ["Time bucket", "Paid revenue (PHP)"],
        ...revenueGrowth.map(({ label, revenue }) => [label, Math.round(revenue * 100) / 100]),
      ],
    },
    {
      name: "Registration Growth",
      rows: [
        ["Event scope", eventName],
        ["Grouping", analyticsPeriod],
        [],
        ["Time bucket", "Registrations"],
        ...registrationGrowth.map(({ label, registrations }) => [label, registrations]),
      ],
    },
    {
      name: "Ticket Performance",
      rows: [
        ["Event", "Tickets sold", "Capacity", "Sold (%)"],
        ...analyticsEvents.map((event) => [
          event.name || "Untitled event",
          event.sold,
          event.total,
          event.total > 0 ? Math.round((event.sold / event.total) * 100) : 0,
        ]),
      ],
    },
    {
      name: "Check-in Activity",
      rows: [
        ["Attendance status", "Attendees"],
        ["Checked in", checkInSummary.checkedIn],
        ["No-shows", checkInSummary.noShow],
        ["Not checked in yet", checkInSummary.notYetCheckedIn],
        ["Total attendees", analyticsAttendees.length],
        ["Check-in rate (%)", checkInRate],
      ],
    },
    {
      name: "Discovery Sources",
      rows: [
        ["Source", "Attendees", "Share (%)"],
        ...discoverySourceCounts.map(({ label, count }) => [
          label,
          count,
          analyticsAttendees.length ? Math.round((count / analyticsAttendees.length) * 100) : 0,
        ]),
      ],
    },
  ];
}

function downloadOrganizerCsv(tables, fileName = "gatherly-organizer-analytics.csv") {
  const encodeCell = (value) => {
    const text = escapeExportText(value);
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const csv = tables.flatMap(({ name, rows }) => [[name], ...rows, []])
    .map((row) => row.map(encodeCell).join(","))
    .join("\r\n");
  downloadOrganizerBlob(`\uFEFF${csv}`, "text/csv;charset=utf-8", fileName);
}

function downloadOrganizerXls(tables, fileName = "gatherly-organizer-analytics.xls") {
  const encodeXml = (value) => escapeExportText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  const worksheets = tables.map(({ name, rows }) => {
    const worksheetRows = rows.map((row) => `<Row>${row.map((value) => {
      const type = typeof value === "number" && Number.isFinite(value) ? "Number" : "String";
      return `<Cell><Data ss:Type="${type}">${encodeXml(value)}</Data></Cell>`;
    }).join("")}</Row>`).join("");
    return `<Worksheet ss:Name="${encodeXml(name.slice(0, 31))}"><Table>${worksheetRows}</Table></Worksheet>`;
  }).join("");
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">${worksheets}</Workbook>`;
  downloadOrganizerBlob(`\uFEFF${workbook}`, "application/vnd.ms-excel;charset=utf-8", fileName);
}

function createOrganizerManagementTables(section, records) {
  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(date);
  };
  if (section === "Events") {
    return [{
      name: "Events",
      rows: [
        ["Event code", "Event", "Venue", "Category", "Start date", "End date", "Time", "Tickets sold", "Capacity", "Status"],
        ...records.map((event) => [
          event.eventCode || "",
          event.name || "Untitled event",
          event.venue || "",
          event.category || "",
          event.date || "",
          event.multipleDay ? event.endDate || "" : "",
          event.time || "",
          Number(event.sold) || 0,
          Number(event.total) || 0,
          event.status || "",
        ]),
      ],
    }];
  }
  if (section === "Orders") {
    return [{
      name: "Orders",
      rows: [
        ["Order number", "Buyer", "Email", "Event", "Ticket", "Amount", "Status", "Ordered at"],
        ...records.map((order) => [
          order.number || "",
          order.buyer || "",
          order.email || "",
          order.event || "",
          order.ticket || "",
          order.amount || "",
          order.status || "",
          formatDateTime(order.createdAt),
        ]),
      ],
    }];
  }
  return [{
    name: "Attendees",
    rows: [
      ["Attendee", "Email", "Ticket", "Event", "Event date", "Check-in status", "Discovery source", "Order number", "Registered at"],
      ...records.map((attendee) => [
        attendee.name || "",
        attendee.email || "",
        attendee.ticket || "",
        attendee.event || "",
        attendee.date || "",
        attendee.checkedIn ? "Checked in" : "Not checked in",
        attendee.discoverySource || "",
        attendee.orderNumber || "",
        formatDateTime(attendee.createdAt),
      ]),
    ],
  }];
}

function organizerPdfText(value) {
  return escapeExportText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function organizerPdfLabel(commands, value, x, y, size = 9, bold = false, color = "0.16 0.17 0.23") {
  commands.push(`${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${organizerPdfText(value)}) Tj ET`);
}

function drawOrganizerPdfHeader(commands, title, subtitle) {
  commands.push("0.46 0.42 0.72 rg 40 724 532 48 re f");
  organizerPdfLabel(commands, "GATHERLY  /  ORGANIZER ANALYTICS", 54, 754, 8, true, "1 1 1");
  organizerPdfLabel(commands, title, 54, 735, 15, true, "1 1 1");
  if (subtitle) organizerPdfLabel(commands, subtitle, 48, 704, 9, false, "0.42 0.42 0.47");
}

function downloadOrganizerTablePdf({ title, tables }) {
  const pages = [];
  tables.forEach(({ name, rows }) => {
    const header = rows[0] || [];
    const dataRows = rows.slice(1);
    const landscape = header.length >= 6;
    const pageWidth = landscape ? 792 : 612;
    const pageHeight = landscape ? 612 : 792;
    const margin = 40;
    const tableWidth = pageWidth - margin * 2;
    const rowHeight = landscape ? 19 : 24;
    const rowsPerPage = landscape ? 18 : 23;
    const chunks = dataRows.length
      ? Array.from({ length: Math.ceil(dataRows.length / rowsPerPage) }, (_, index) => dataRows.slice(index * rowsPerPage, (index + 1) * rowsPerPage))
      : [[]];
    chunks.forEach((chunk, chunkIndex) => {
      const commands = [];
      const headerRectY = pageHeight - 68;
      commands.push(`0.46 0.42 0.72 rg ${margin} ${headerRectY} ${tableWidth} 48 re f`);
      organizerPdfLabel(commands, "GATHERLY  /  ORGANIZER WORKSPACE", margin + 14, pageHeight - 38, 8, true, "1 1 1");
      organizerPdfLabel(commands, title, margin + 14, pageHeight - 57, 15, true, "1 1 1");
      const tableTitleY = headerRectY - 24;
      organizerPdfLabel(commands, `${name}${chunks.length > 1 ? ` (continued ${chunkIndex + 1}/${chunks.length})` : ""}`, margin, tableTitleY, 12, true);

      const columnWidth = tableWidth / Math.max(header.length, 1);
      const headerY = tableTitleY - 27;
      commands.push(`0.94 0.93 0.97 rg ${margin} ${headerY - 8} ${tableWidth} 22 re f`);
      header.forEach((cell, columnIndex) => {
        const maxLength = Math.max(6, Math.floor((columnWidth - 12) / 4.2));
        const text = String(cell ?? "");
        organizerPdfLabel(commands, text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text, margin + 6 + columnIndex * columnWidth, headerY, 8, true, "0.28 0.25 0.47");
      });
      if (!chunk.length) {
        organizerPdfLabel(commands, "No matching records.", margin + 8, headerY - 28, 9, false, "0.42 0.42 0.47");
      }
      chunk.forEach((row, rowIndex) => {
        const rowY = headerY - 24 - rowIndex * rowHeight;
        if (rowIndex % 2 === 0) commands.push(`0.985 0.98 0.99 rg ${margin} ${rowY - 7} ${tableWidth} ${rowHeight} re f`);
        row.forEach((cell, columnIndex) => {
          const maxLength = Math.max(6, Math.floor((columnWidth - 12) / 3.8));
          const text = String(cell ?? "");
          organizerPdfLabel(commands, text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text, margin + 6 + columnIndex * columnWidth, rowY, 7, false);
        });
      });
      pages.push({ commands, pageWidth, pageHeight });
    });
  });

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const pageReferences = [];
  pages.forEach(({ commands, pageWidth, pageHeight }, index) => {
    organizerPdfLabel(commands, "GATHERLY  |  ORGANIZER DATA EXPORT", 40, 28, 8, true, "0.52 0.50 0.60");
    organizerPdfLabel(commands, `${index + 1} / ${pages.length}`, pageWidth - 72, 28, 8, false, "0.52 0.50 0.60");
    const contentId = 5 + index * 2;
    const pageId = contentId + 1;
    const stream = commands.join("\n");
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
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
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  downloadOrganizerBlob(pdf, "application/pdf", `gatherly-organizer-${title.toLowerCase()}.pdf`);
}

function drawOrganizerPdfLineChart(commands, { title, period, buckets, valueKey, top, formatValue = (value) => String(value) }) {
  organizerPdfLabel(commands, title, 48, top, 12, true);
  const values = buckets.map((bucket) => Number(bucket[valueKey]) || 0);
  const maximum = Math.max(...values, 1);
  const left = 78;
  const right = 558;
  const chartTop = top - 30;
  const chartBottom = top - 135;
  const points = buckets.map((bucket, index) => ({
    x: left + (buckets.length > 1 ? index * ((right - left) / (buckets.length - 1)) : (right - left) / 2),
    y: chartBottom + (values[index] / maximum) * (chartTop - chartBottom),
    label: bucket.label,
    value: values[index],
  }));
  [0, maximum / 2, maximum].forEach((tickValue) => {
    const y = chartBottom + (tickValue / maximum) * (chartTop - chartBottom);
    commands.push(`0.88 0.87 0.86 RG 0.5 w ${left} ${y.toFixed(2)} m ${right} ${y.toFixed(2)} l S`);
    organizerPdfLabel(commands, formatValue(tickValue), 48, y - 3, 7, false, "0.42 0.42 0.47");
  });
  if (points.length > 1) {
    commands.push(`0.46 0.42 0.72 RG 2 w 1 J 1 j ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} m`);
    points.slice(1).forEach((point) => commands.push(`${point.x.toFixed(2)} ${point.y.toFixed(2)} l`));
    commands.push("S");
  }
  points.forEach((point, index) => {
    commands.push(`0.46 0.42 0.72 rg ${point.x - 2} ${point.y - 2} 4 4 re f`);
    if (period !== "day" || index % 3 === 0 || index === points.length - 1) {
      organizerPdfLabel(commands, point.label, Math.max(left, Math.min(right - 36, point.x - 15)), chartBottom - 13, 7, false, "0.42 0.42 0.47");
    }
  });
}

function drawOrganizerPdfBars(commands, { title, items, top, maximumRows = 14 }) {
  organizerPdfLabel(commands, title, 48, top, 12, true);
  const visibleItems = items.slice(0, maximumRows);
  const maximum = Math.max(1, ...visibleItems.map((item) => item.value));
  visibleItems.forEach((item, index) => {
    const y = top - 25 - index * 27;
    const label = item.label.length > 48 ? `${item.label.slice(0, 45)}...` : item.label;
    organizerPdfLabel(commands, label, 48, y, 8, true);
    organizerPdfLabel(commands, String(item.value), 544, y, 8, true);
    commands.push(`0.93 0.92 0.91 rg 48 ${y - 12} 512 6 re f`);
    commands.push(`0.46 0.42 0.72 rg 48 ${y - 12} ${(512 * item.value / maximum).toFixed(2)} 6 re f`);
  });
  return visibleItems.length;
}

function drawOrganizerPdfParagraph(commands, text, x, y, maxCharacters, size = 10) {
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
      organizerPdfLabel(commands, line, x, currentY, size);
      currentY -= size + 4;
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) {
    organizerPdfLabel(commands, line, x, currentY, size);
    currentY -= size + 4;
  }
  return currentY;
}

function drawOrganizerPdfSummarySection(commands, title, items, startY) {
  organizerPdfLabel(commands, title, 48, startY, 14, true);
  let currentY = startY - 23;
  if (!items.length) {
    organizerPdfLabel(commands, "No additional notes.", 56, currentY, 9, false, "0.42 0.42 0.47");
    return currentY - 18;
  }
  items.forEach((item) => {
    organizerPdfLabel(commands, "-", 52, currentY, 10, true, "0.46 0.42 0.72");
    currentY = drawOrganizerPdfParagraph(commands, item, 67, currentY, 88, 9) - 5;
  });
  return currentY - 10;
}

function downloadOrganizerAnalyticsPdf({ tables, revenueGrowth, revenueAnalyticsPeriod, registrationGrowth, analyticsPeriod, checkInSummary, report }) {
  const pages = [];
  const generatedAt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date());
  const trends = [];
  drawOrganizerPdfHeader(trends, "Analytics trends", "Paid revenue and attendee registrations");
  drawOrganizerPdfLineChart(trends, {
    title: "Revenue analytics (PHP)",
    period: revenueAnalyticsPeriod,
    buckets: revenueGrowth,
    valueKey: "revenue",
    top: 665,
    formatValue: (value) => `PHP ${Math.round(value).toLocaleString("en-PH")}`,
  });
  drawOrganizerPdfLineChart(trends, {
    title: "Registration growth",
    period: analyticsPeriod,
    buckets: registrationGrowth,
    valueKey: "registrations",
    top: 480,
  });
  pages.push(trends);

  const performanceRows = tables.find(({ name }) => name === "Ticket Performance").rows.slice(1);
  const performancePageCount = Math.max(1, Math.ceil(performanceRows.length / 14));
  for (let pageIndex = 0; pageIndex < performancePageCount; pageIndex += 1) {
    const performance = [];
    drawOrganizerPdfHeader(performance, "Ticket performance", "Tickets sold compared with capacity");
    const eventRows = performanceRows.slice(pageIndex * 14, (pageIndex + 1) * 14);
    const rowsDrawn = drawOrganizerPdfBars(performance, {
      title: pageIndex === 0 ? "Tickets sold by event" : "Tickets sold by event (continued)",
      items: eventRows.map(([label, sold, capacity, percentage]) => ({
        label: `${label} (${sold}/${capacity})`,
        value: Number(percentage) || 0,
      })),
      top: 670,
      maximumRows: 14,
    });
    if (pageIndex === 0) {
      const attendanceItems = [
        { label: "Checked in", value: checkInSummary.checkedIn },
        { label: "No-shows", value: checkInSummary.noShow },
        { label: "Not checked in yet", value: checkInSummary.notYetCheckedIn },
      ];
      drawOrganizerPdfBars(performance, { title: "Check-in activity", items: attendanceItems, top: 635 - rowsDrawn * 27, maximumRows: 3 });
    }
    pages.push(performance);
  }

  const sourceRows = tables.find(({ name }) => name === "Discovery Sources").rows.slice(1);
  const sourcePageCount = Math.max(1, Math.ceil(sourceRows.length / 22));
  for (let pageIndex = 0; pageIndex < sourcePageCount; pageIndex += 1) {
    const sources = [];
    drawOrganizerPdfHeader(sources, "Attendee discovery sources", "How attendees found your events");
    drawOrganizerPdfBars(sources, {
      title: pageIndex === 0 ? "Registration sources" : "Registration sources (continued)",
      items: sourceRows.slice(pageIndex * 22, (pageIndex + 1) * 22)
        .map(([label, value]) => ({ label, value: Number(value) || 0 })),
      top: 670,
      maximumRows: 22,
    });
    pages.push(sources);
  }

  const summary = [];
  drawOrganizerPdfHeader(summary, "Final summary", `AI-assisted review | ${generatedAt}`);
  organizerPdfLabel(summary, "Performance overview", 48, 665, 14, true);
  let summaryY = drawOrganizerPdfParagraph(summary, report.executiveSummary, 48, 642, 88, 10) - 14;
  summaryY = drawOrganizerPdfSummarySection(summary, "Highlights", report.highlights, summaryY);
  summaryY = drawOrganizerPdfSummarySection(summary, "Risks", report.risks, summaryY);
  drawOrganizerPdfSummarySection(summary, "Recommended actions", report.recommendations, summaryY);
  pages.push(summary);

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const pageReferences = [];
  pages.forEach((commands, index) => {
    organizerPdfLabel(commands, "GATHERLY  |  ORGANIZER ANALYTICS", 40, 30, 8, true, "0.52 0.50 0.60");
    organizerPdfLabel(commands, `${index + 1} / ${pages.length}`, 540, 30, 8, false, "0.52 0.50 0.60");
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
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  downloadOrganizerBlob(pdf, "application/pdf", "gatherly-organizer-analytics.pdf");
}

function toTimeInputValue(value) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return /^\d{2}:\d{2}$/.test(value) ? value : "";
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function hasEventEndedAt(event, now) {
  const date = event.multipleDay && event.endDate ? event.endDate : event.date;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(toTimeInputValue(event.time || ""));
  if (!dateMatch || !timeMatch) return false;
  const [, year, month, day] = dateMatch;
  const [, hours, minutes] = timeMatch;
  const dateUtc = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const parsedDate = new Date(dateUtc);
  if (parsedDate.toISOString().slice(0, 10) !== date) return false;
  const eventEnd = dateUtc + (Number(hours) - 8) * 60 * 60 * 1000 + Number(minutes) * 60 * 1000;
  return now >= eventEnd;
}

function hasEventEnded(event) {
  return hasEventEndedAt(event, Date.now());
}

function DashboardSidebar({ active, setActive, mobileOpen, setMobileOpen, onHelp, onSettings, orderCount }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#2D3142] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between px-7">
        <div className="flex items-center gap-3" aria-label="Gatherly">
          <div className="grid size-9 place-items-center rounded-xl bg-[#756FB8] shadow-[0_8px_24px_rgba(114,87,245,.35)]">
            <div className="size-3 rotate-45 rounded-[3px] border-2 border-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Gatherly</span>
        </div>
        <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><Icon name="close" /></button>
      </div>
      <div className="px-4 pt-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Workspace</p>
        <nav className="space-y-1">
          {nav.map(([label, icon]) => (
            <button key={label} onClick={() => { setActive(label); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${active === label ? "bg-white text-[#2D3142]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
              <Icon name={icon} className="size-[19px]" />{label}
              {label === "Orders" && orderCount > 0 && <span className="ml-auto rounded-full bg-[#756FB8] px-2 py-0.5 text-[10px] text-white">{orderCount}</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="mb-4 rounded-2xl bg-white/[.06] p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-[#F4DFA6] text-[#2D3142]"><Icon name="help" className="size-5" /></div>
          <p className="text-sm font-bold">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-white/45">Our event experts are here to help.</p>
          <button onClick={onHelp} className="mt-3 text-xs font-bold text-[#C4BEE5] hover:text-white">Visit help center →</button>
        </div>
        <button onClick={onSettings} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-white/55 hover:bg-white/5 hover:text-white"><Icon name="settings" className="size-[19px]" />Settings</button>
      </div>
    </aside>
  );
}

function Dashboard({ user, onSignOut, onUserUpdate }) {
  const [active, setActive] = useState("Overview");
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All events");
  const [showArchivedEvents, setShowArchivedEvents] = useState(false);
  const [orderEventTab, setOrderEventTab] = useState("overview");
  const [attendeeEventTab, setAttendeeEventTab] = useState("overview");
  const [hiddenOrderEventCodes, setHiddenOrderEventCodes] = useState([]);
  const [hiddenAttendeeEventCodes, setHiddenAttendeeEventCodes] = useState([]);
  const [eventTabSettingsSection, setEventTabSettingsSection] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [utilityModal, setUtilityModal] = useState("");
  const [profileAction, setProfileAction] = useState("");
  const [profileName, setProfileName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordCheck, setCurrentPasswordCheck] = useState({ state: "empty", value: "", message: "" });
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordCheck, setNewPasswordCheck] = useState({ state: "empty", value: "", message: "" });
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, new: false, confirm: false });
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [actionConfirmation, setActionConfirmation] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [attendeeCheckInConfirmation, setAttendeeCheckInConfirmation] = useState(null);
  const [attendeeCheckInSubmitting, setAttendeeCheckInSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [eventFormStep, setEventFormStep] = useState(1);
  const [eventFormBasics, setEventFormBasics] = useState({});
  const [helpSearch, setHelpSearch] = useState("");
  const [preferences, setPreferences] = useState({
    orderEmails: true,
    eventReminders: true,
    weeklySummary: false,
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [multipleDay, setMultipleDay] = useState(false);
  const [pricingMode, setPricingMode] = useState("free");
  const [eventPrice, setEventPrice] = useState("");
  const [ticketTypes, setTicketTypes] = useState([
    { id: "", name: "General Admission", price: "" },
    { id: "", name: "VIP", price: "" },
  ]);
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [venueInput, setVenueInput] = useState("");
  const [venueSelected, setVenueSelected] = useState(false);
  const [venueSuggestions, setVenueSuggestions] = useState([]);
  const [venueSuggestionsLoading, setVenueSuggestionsLoading] = useState(false);
  const [venueSuggestionError, setVenueSuggestionError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("day");
  const [revenueAnalyticsPeriod, setRevenueAnalyticsPeriod] = useState("day");
  const [organizerAnalyticsExportOpen, setOrganizerAnalyticsExportOpen] = useState(false);
  const [organizerAnalyticsExporting, setOrganizerAnalyticsExporting] = useState(false);
  const [organizerAnalyticsExportError, setOrganizerAnalyticsExportError] = useState("");
  const [organizerTableExportOpen, setOrganizerTableExportOpen] = useState(false);
  const [organizerTableExportError, setOrganizerTableExportError] = useState("");
  const [analyticsEventTab, setAnalyticsEventTab] = useState("overview");
  const [hiddenAnalyticsEventCodes, setHiddenAnalyticsEventCodes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [attendees, setAttendees] = useState([]);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();
    const intervalId = window.setInterval(updateCurrentTime, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (profileAction !== "password" || !currentPassword) {
      return undefined;
    }

    let activeRequest = true;
    const timeoutId = window.setTimeout(() => {
      api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: user.email, password: currentPassword }),
      }).then(() => {
        if (activeRequest) {
          setCurrentPasswordCheck({
            state: "valid",
            value: currentPassword,
            message: "Current password is correct.",
          });
        }
      }).catch((error) => {
        if (activeRequest) {
          if (error.status === 401) {
            setCurrentPasswordCheck({
              state: "invalid",
              value: currentPassword,
              message: "This does not match your current password.",
            });
          } else {
            setCurrentPasswordCheck({ state: "error", value: currentPassword, message: error.message });
          }
        }
      });
    }, 350);

    return () => {
      activeRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentPassword, profileAction, user.email]);

  useEffect(() => {
    if (profileAction !== "password" || !newPassword || !getPasswordRequirements(newPassword).every(([, met]) => met)) {
      return undefined;
    }

    let activeRequest = true;
    const timeoutId = window.setTimeout(() => {
      api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: user.email, password: newPassword }),
      }).then(() => {
        if (activeRequest) {
          setNewPasswordCheck({
            state: "same",
            value: newPassword,
            message: "New password must be different from your current password.",
          });
        }
      }).catch((error) => {
        if (!activeRequest) return;
        if (error.status === 401) {
          setNewPasswordCheck({
            state: "different",
            value: newPassword,
            message: "New password is different from your current password.",
          });
        } else {
          setNewPasswordCheck({ state: "error", value: newPassword, message: error.message });
        }
      });
    }, 350);

    return () => {
      activeRequest = false;
      window.clearTimeout(timeoutId);
    };
  }, [newPassword, profileAction, user.email]);

  useEffect(() => {
    let activeRequest = true;
    Promise.all([api("/events"), api("/orders"), api("/attendees")])
      .then(([loadedEvents, loadedOrders, loadedAttendees]) => {
        if (!activeRequest) return;
        setEvents(loadedEvents);
        setOrders(loadedOrders);
        setAttendees(loadedAttendees);
      })
      .catch((error) => {
        if (activeRequest) setNotice(error.message);
      });

    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    const query = venueInput.trim();
    if (!modalOpen || query.length < 3 || venueSelected) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setVenueSuggestionsLoading(true);
      setVenueSuggestionError("");
      api(`/places/autocomplete?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(({ suggestions }) => setVenueSuggestions(suggestions))
        .catch((error) => {
          if (!controller.signal.aborted) {
            setVenueSuggestions([]);
            setVenueSuggestionError(error.message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setVenueSuggestionsLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [modalOpen, venueInput, venueSelected]);

  const archiveView = active === "Events" && showArchivedEvents;
  const filtered = useMemo(() => events.filter((event) => {
    const isArchived = ["Finished", "Cancelled"].includes(event.status);
    if (isArchived !== archiveView) return false;
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase()) || event.venue.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = active === "Overview" || filter === (archiveView ? "All archived" : "All events") || event.status === filter;
    return matchesSearch && matchesFilter;
  }), [events, search, filter, archiveView, active]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 3));
  const pagedEvents = filtered.slice((page - 1) * 3, page * 3);
  const selectedEvent = events.find((event) => event.id === editingEvent);

  async function saveEvent(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (eventFormStep === 1) {
      if (!venueSelected) {
        setVenueSuggestionError("Choose a venue suggestion located in the Philippines.");
        event.currentTarget.elements.namedItem("venue").focus();
        return;
      }
      setEventFormBasics(Object.fromEntries(form.entries()));
      setEventFormStep(2);
      return;
    }
    const formValues = { ...eventFormBasics, ...Object.fromEntries(form.entries()) };
    if (!venueSelected) {
      setVenueSuggestionError("Choose a venue suggestion located in the Philippines.");
      setEventFormStep(1);
      return;
    }
    const values = {
      name: String(formValues.name || "").trim(),
      date: String(formValues.date || ""),
      multipleDay: formValues.multipleDay === "true",
      endDate: String(formValues.endDate || ""),
      time: String(formValues.time || ""),
      venue: String(formValues.venue || "").trim(),
      description: String(formValues.description || "").trim(),
      category: String(formValues.category || "").trim(),
      headliner: String(formValues.headliner || "").trim(),
      total: Number(formValues.capacity) || 100,
      pricingMode,
      priceCents: pricingMode === "single" ? Math.round(Number(eventPrice) * 100) : 0,
      ticketTypes: pricingMode === "multiple" ? ticketTypes.map((ticket) => ({
        ...(ticket.id ? { id: ticket.id } : {}),
        name: ticket.name.trim(),
        priceCents: Math.round(Number(ticket.price) * 100),
      })) : [],
    };
    setActionConfirmation({
      type: editingEvent ? "save" : "create",
      event: selectedEvent || { name: values.name },
      values,
    });
  }

  async function confirmEventAction() {
    if (!actionConfirmation || actionSubmitting) return;
    setActionSubmitting(true);
    try {
      const { type, event } = actionConfirmation;
      if (type === "cancel") {
        const updated = await api(`/events/${event.id}/cancel`, { method: "PATCH" });
        setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
        setPage(1);
        setNotice("Event cancelled and moved to the archive.");
      } else if (type === "finish") {
        const updated = await api(`/events/${event.id}/finish`, { method: "PATCH" });
        setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
        setNotice("Event marked as finished.");
      } else if (type === "publish") {
        const updated = await api(`/events/${event.id}/publish`, { method: "PATCH" });
        setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
        setNotice("Event published and is now on sale.");
      } else if (type === "create") {
        const created = await api("/events", {
          method: "POST",
          body: JSON.stringify(actionConfirmation.values),
        });
        setEvents((current) => [created, ...current]);
        setNotice("Event created and saved as a draft.");
        setModalOpen(false);
        setEditingEvent(null);
        setEventFormStep(1);
        setEventFormBasics({});
        setMultipleDay(false);
        setPricingMode("free");
        setEventPrice("");
        setTicketTypes([{ id: "", name: "General Admission", price: "" }, { id: "", name: "VIP", price: "" }]);
        setEventStartDate("");
        setEventEndDate("");
        setVenueInput("");
        setVenueSelected(false);
        setVenueSuggestions([]);
      } else if (type === "save") {
        const updated = await api(`/events/${event.id}`, {
          method: "PATCH",
          body: JSON.stringify(actionConfirmation.values),
        });
        setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
        setModalOpen(false);
        setEditingEvent(null);
        setEventFormStep(1);
        setEventFormBasics({});
        setNotice("Event details updated.");
      }
      setActionConfirmation(null);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setActionSubmitting(false);
    }
    window.setTimeout(() => setNotice(""), 3200);
  }

  function publishEvent(event) {
    setActionConfirmation({ type: "publish", event });
  }

  async function toggleAttendee(person) {
    if (!person.checkedIn) {
      setAttendeeCheckInConfirmation(person);
      return;
    }

    try {
      const updated = await api(`/attendees/${person.id}`, {
        method: "PATCH",
        body: JSON.stringify({ checkedIn: false }),
      });
      setAttendees((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice("Check-in undone.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      window.setTimeout(() => setNotice(""), 3200);
    }
  }

  async function confirmAttendeeCheckIn() {
    if (!attendeeCheckInConfirmation || attendeeCheckInSubmitting) return;
    setAttendeeCheckInSubmitting(true);
    try {
      const updated = await api(`/attendees/${attendeeCheckInConfirmation.id}`, {
        method: "PATCH",
        body: JSON.stringify({ checkedIn: true }),
      });
      setAttendees((current) => current.map((item) => item.id === updated.id ? updated : item));
      setAttendeeCheckInConfirmation(null);
      setNotice("Attendee checked in.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setAttendeeCheckInSubmitting(false);
      window.setTimeout(() => setNotice(""), 3200);
    }
  }

  async function handleSignOut() {
    try {
      await onSignOut();
    } catch (error) {
      setLogoutConfirmOpen(false);
      setNotice(error.message);
      window.setTimeout(() => setNotice(""), 3200);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (profileSubmitting) return;
    setProfileSubmitting(true);
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
      setProfileMessage("Your profile has been updated.");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (profileSubmitting) return;
    if (newPassword !== confirmNewPassword) {
      setProfileError("The new passwords do not match.");
      return;
    }
    setProfileSubmitting(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const result = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      setCurrentPassword("");
      setCurrentPasswordCheck({ state: "empty", value: "", message: "" });
      setNewPassword("");
      setNewPasswordCheck({ state: "empty", value: "", message: "" });
      setConfirmNewPassword("");
      setProfileAction("");
      setProfileMessage(result.message);
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileSubmitting(false);
    }
  }

  const firstName = user.name.split(" ")[0];
  const userInitials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const revenue = orders
    .filter((order) => order.status === "Paid")
    .reduce((sum, order) => sum + Number(String(order.amount).replace(/[^\d.]/g, "")), 0);
  const ticketsSold = events.reduce((sum, event) => sum + event.sold, 0);
  const activeEvents = events.filter((event) => event.status === "On sale").length;
  const draftEvents = events.filter((event) => event.status === "Draft").length;
  const featuredEvent = events
    .filter((event) => event.status === "On sale")
    .map((event) => ({ event, startsAt: getEventStartAt(event) }))
    .filter(({ startsAt }) => startsAt && startsAt.getTime() >= currentTime)
    .sort((first, second) => first.startsAt - second.startsAt)[0]?.event;
  const daysUntilFeaturedEvent = featuredEvent ? getDaysUntilEvent(featuredEvent, currentTime) : null;
  const eventTabEvents = events.filter((event) => ["On sale", "Finished", "Cancelled"].includes(event.status) && event.eventCode);
  const visibleOrderTabs = eventTabEvents.filter((event) => !hiddenOrderEventCodes.includes(event.eventCode));
  const visibleAttendeeTabs = eventTabEvents.filter((event) => !hiddenAttendeeEventCodes.includes(event.eventCode));
  const activeOrderEventTab = visibleOrderTabs.some((event) => event.eventCode === orderEventTab) ? orderEventTab : "overview";
  const activeAttendeeEventTab = visibleAttendeeTabs.some((event) => event.eventCode === attendeeEventTab) ? attendeeEventTab : "overview";
  const visibleOrders = activeOrderEventTab !== "overview"
    ? orders.filter((order) => order.eventCode === activeOrderEventTab)
    : orders;
  const visibleAttendees = activeAttendeeEventTab !== "overview"
    ? attendees.filter((person) => person.eventCode === activeAttendeeEventTab)
    : attendees;
  const analyticsTabEvents = eventTabEvents.filter((event) => !hiddenAnalyticsEventCodes.includes(event.eventCode));
  const selectedAnalyticsEvent = analyticsTabEvents.find((event) => event.eventCode === analyticsEventTab);
  const analyticsEvents = selectedAnalyticsEvent
    ? [selectedAnalyticsEvent]
    : analyticsTabEvents;
  const analyticsEventCodes = new Set(analyticsEvents.map((event) => event.eventCode));
  const analyticsOrders = orders.filter((order) => order.status === "Paid" && analyticsEventCodes.has(order.eventCode));
  const analyticsAttendees = attendees.filter((person) => analyticsEventCodes.has(person.eventCode));
  const discoverySourceCounts = [...analyticsAttendees.reduce((counts, attendee) => {
    const source = typeof attendee.discoverySource === "string" ? attendee.discoverySource.trim() : "";
    const label = source || "Not provided";
    const key = label.toLocaleLowerCase();
    const entry = counts.get(key) || { label, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
    return counts;
  }, new Map()).values()]
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
  const discoverySourceMax = Math.max(1, ...discoverySourceCounts.map((source) => source.count));
  const checkInSummary = analyticsAttendees.reduce((summary, attendee) => {
    const attendeeEvent = analyticsEvents.find((event) => event.eventCode === attendee.eventCode || event.id === attendee.eventId);
    if (attendeeEvent?.status === "Cancelled") return summary;
    if (attendee.checkedIn) {
      summary.checkedIn += 1;
    } else if (attendeeEvent
      ? attendeeEvent.status === "Finished" || hasEventEndedAt(attendeeEvent, currentTime)
      : hasEventEndedAt(attendee, currentTime)) {
      summary.noShow += 1;
    } else {
      summary.notYetCheckedIn += 1;
    }
    return summary;
  }, { checkedIn: 0, noShow: 0, notYetCheckedIn: 0 });
  const checkInTotal = checkInSummary.checkedIn + checkInSummary.noShow + checkInSummary.notYetCheckedIn;
  const checkInRate = checkInTotal ? Math.round((checkInSummary.checkedIn / checkInTotal) * 100) : 0;
  const checkedInStop = checkInTotal ? (checkInSummary.checkedIn / checkInTotal) * 100 : 0;
  const noShowStop = checkInTotal ? checkedInStop + (checkInSummary.noShow / checkInTotal) * 100 : 0;
  const checkInPieStyle = checkInTotal
    ? { background: `conic-gradient(#756FB8 0% ${checkedInStop}%, #D97764 ${checkedInStop}% ${noShowStop}%, #E8E5DF ${noShowStop}% 100%)` }
    : { background: "#E8E5DF" };
  const registrationGrowth = currentTime
    ? buildRegistrationGrowth(analyticsAttendees, analyticsPeriod, currentTime)
    : [];
  const registrationGrowthTotal = registrationGrowth.reduce((total, bucket) => total + bucket.registrations, 0);
  const registrationGrowthMax = Math.max(1, ...registrationGrowth.map((bucket) => bucket.registrations));
  const registrationChart = registrationGrowth.map((bucket, index) => ({
    ...bucket,
    x: registrationGrowth.length > 1 ? 48 + index * (660 / (registrationGrowth.length - 1)) : 378,
    y: 190 - (bucket.registrations / registrationGrowthMax) * 160,
  }));
  const registrationChartLine = registrationChart.map((point) => `${point.x},${point.y}`).join(" ");
  const revenueGrowth = currentTime
    ? buildRevenueGrowth(analyticsOrders, revenueAnalyticsPeriod, currentTime)
    : [];
  const revenueGrowthTotal = revenueGrowth.reduce((total, bucket) => total + bucket.revenue, 0);
  const revenueGrowthMax = Math.max(1, ...revenueGrowth.map((bucket) => bucket.revenue));
  const revenueChart = revenueGrowth.map((bucket, index) => ({
    ...bucket,
    x: revenueGrowth.length > 1 ? 48 + index * (660 / (revenueGrowth.length - 1)) : 378,
    y: 190 - (bucket.revenue / revenueGrowthMax) * 160,
  }));
  const revenueChartLine = revenueChart.map((point) => `${point.x},${point.y}`).join(" ");
  const analyticsTicketsSold = analyticsEvents.reduce((sum, event) => sum + event.sold, 0);
  const analyticsCapacity = analyticsEvents.reduce((sum, event) => sum + event.total, 0);
  const analyticsRevenue = analyticsOrders.reduce((sum, order) => sum + Number(String(order.amount).replace(/[^\d.]/g, "")), 0);
  const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
  const organizerAnalyticsTables = createOrganizerAnalyticsTables({
    selectedAnalyticsEvent,
    revenueAnalyticsPeriod,
    revenueGrowth,
    analyticsPeriod,
    registrationGrowth,
    analyticsEvents,
    analyticsAttendees,
    checkInSummary,
    checkInRate,
    discoverySourceCounts,
  });
  const organizerAnalyticsExport = async (format) => {
    setOrganizerAnalyticsExportOpen(false);
    setOrganizerAnalyticsExportError("");
    if (format === "csv") {
      downloadOrganizerCsv(organizerAnalyticsTables);
    } else if (format === "xls") {
      downloadOrganizerXls(organizerAnalyticsTables);
    } else {
      setOrganizerAnalyticsExporting(true);
      try {
        const report = await api("/organizer/analytics-report", {
          method: "POST",
          body: JSON.stringify({
            scope: selectedAnalyticsEvent ? "selected event" : "all visible published events",
            revenue: {
              period: revenueAnalyticsPeriod,
              buckets: revenueGrowth.map(({ label, revenue }) => ({ label, value: Math.round(revenue * 100) / 100 })),
            },
            registrations: {
              period: analyticsPeriod,
              buckets: registrationGrowth.map(({ label, registrations }) => ({ label, value: registrations })),
            },
            metrics: {
              eventCount: analyticsEvents.length,
              ticketsSold: analyticsTicketsSold,
              ticketCapacity: analyticsCapacity,
              attendees: analyticsAttendees.length,
              checkedIn: checkInSummary.checkedIn,
              noShows: checkInSummary.noShow,
              notYetCheckedIn: checkInSummary.notYetCheckedIn,
              checkInRate,
              revenue: analyticsRevenue,
            },
            ticketPerformance: analyticsEvents.map(({ sold, total }) => ({ sold, capacity: total })),
            discoverySources: discoverySourceCounts.map(({ count }) => count),
          }),
        });
        downloadOrganizerAnalyticsPdf({
          tables: organizerAnalyticsTables,
          revenueGrowth,
          revenueAnalyticsPeriod,
          registrationGrowth,
          analyticsPeriod,
          checkInSummary,
          report,
        });
      } catch (error) {
        setOrganizerAnalyticsExportError(`Could not export organizer analytics PDF: ${error.message}`);
      } finally {
        setOrganizerAnalyticsExporting(false);
      }
    }
  };
  const organizerTableExport = (format) => {
    setOrganizerTableExportOpen(false);
    setOrganizerTableExportError("");
    const title = active;
    const records = active === "Events" ? filtered : active === "Orders" ? visibleOrders : visibleAttendees;
    try {
      const tables = createOrganizerManagementTables(title, records);
      const fileName = `gatherly-organizer-${title.toLowerCase()}`;
      if (format === "csv") {
        downloadOrganizerCsv(tables, `${fileName}.csv`);
      } else if (format === "xls") {
        downloadOrganizerXls(tables, `${fileName}.xls`);
      } else {
        downloadOrganizerTablePdf({ title, tables });
      }
    } catch (error) {
      setOrganizerTableExportError(`Could not export ${title.toLowerCase()} ${format.toUpperCase()}: ${error.message}`);
    }
  };
  const renderOrganizerTableExportMenu = () => (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={organizerTableExportOpen}
        onClick={() => setOrganizerTableExportOpen((open) => !open)}
        className="h-11 shrink-0 rounded-xl border border-black/[.08] bg-white px-4 text-xs font-bold text-[#756FB8] transition hover:bg-[#F8F6F3]"
      >
        Export
      </button>
      {organizerTableExportOpen && <div role="menu" aria-label={`Export ${active.toLowerCase()}`} className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-xl border border-black/[.08] bg-white p-1.5 shadow-xl">
        <button type="button" role="menuitem" onClick={() => organizerTableExport("pdf")} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]">Export PDF</button>
        <button type="button" role="menuitem" onClick={() => organizerTableExport("csv")} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]">Export CSV</button>
        <button type="button" role="menuitem" onClick={() => organizerTableExport("xls")} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]">Export Excel (.xls)</button>
      </div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#2D3142]">
      <DashboardSidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onHelp={() => setUtilityModal("help")}
        onSettings={() => setUtilityModal("settings")}
        orderCount={orders.length}
      />
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-black/[.06] bg-[#F7F4EF]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <button className="mr-3 rounded-xl border border-black/10 bg-white p-2.5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Icon name="search" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black/35" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-11 w-full rounded-xl border border-black/[.07] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-black/30 focus:border-[#756FB8]/50 focus:ring-4 focus:ring-[#756FB8]/10" placeholder="Search events, attendees, orders..." />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <button onClick={() => { setNotice("You’re all caught up—no new notifications."); window.setTimeout(() => setNotice(""), 3200); }} className="relative grid size-11 place-items-center rounded-xl border border-black/[.07] bg-white text-black/55 transition hover:text-black" aria-label="Notifications">
              <Icon name="bell" className="size-[19px]" /><span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-[#756FB8]" />
            </button>
            <div className="h-8 w-px bg-black/10" />
            <button onClick={() => { setUtilityModal("profile"); setProfileAction(""); setProfileError(""); setProfileMessage(""); }} aria-label="Open profile" title="Open profile" className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white">
              <div className="grid size-9 place-items-center rounded-xl bg-[#E6E2F2] text-xs font-extrabold text-[#7067AD]">{userInitials}</div>
              <div className="hidden text-left sm:block"><p className="text-sm font-bold">{user.name}</p><p className="text-[11px] text-black/40">Profile</p></div>
            </button>
            <button onClick={() => setLogoutConfirmOpen(true)} className="rounded-xl border border-black/[.07] bg-white px-3 py-2 text-xs font-bold text-black/55 transition hover:text-black">Sign out</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {organizerTableExportError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{organizerTableExportError}</p>}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#756FB8]">Organizer workspace</p>
              <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{active === "Overview" ? `Good day, ${firstName}.` : active}</h1>
              <p className="mt-2 text-sm text-black/45">{active === "Overview" ? "Here’s what’s happening across your events." : `Manage your ${active.toLowerCase()} in one place.`}</p>
            </div>
            {(active === "Overview" || active === "Events") && <div className="flex flex-wrap gap-2">
              <button onClick={() => { setEditingEvent(null); setEventFormStep(1); setEventFormBasics({}); setMultipleDay(false); setPricingMode("free"); setEventPrice(""); setTicketTypes([{ id: "", name: "General Admission", price: "" }, { id: "", name: "VIP", price: "" }]); setEventStartDate(""); setEventEndDate(""); setVenueInput(""); setVenueSelected(false); setVenueSuggestions([]); setVenueSuggestionError(""); setModalOpen(true); }} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#756FB8] px-5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(114,87,245,.25)] transition hover:-translate-y-0.5 hover:bg-[#625CA4]">
                <Icon name="plus" className="size-4" />Create event
              </button>
              {active === "Events" && <button type="button" onClick={() => { setShowArchivedEvents((current) => !current); setFilter(archiveView ? "All events" : "All archived"); setPage(1); }} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-black/[.08] bg-white px-5 text-sm font-bold text-[#2D3142] transition hover:bg-[#F8F6F3]">
                <Icon name="archive" className="size-4" />{showArchivedEvents ? "Back to events" : "Archive"}
              </button>}
              {active === "Events" && renderOrganizerTableExportMenu()}
            </div>}
            {active === "Analytics" && <div className="relative self-start sm:self-end">
              <button
                type="button"
                disabled={organizerAnalyticsExporting}
                aria-busy={organizerAnalyticsExporting}
                aria-haspopup="menu"
                aria-expanded={organizerAnalyticsExportOpen}
                onClick={() => setOrganizerAnalyticsExportOpen((open) => !open)}
                className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-xs font-bold text-[#756FB8] transition hover:bg-[#F8F6F3] disabled:cursor-wait disabled:opacity-60"
              >
                {organizerAnalyticsExporting ? "Generating report..." : "Export"}
              </button>
              {organizerAnalyticsExportOpen && <div role="menu" aria-label="Export organizer analytics" className="absolute right-0 top-full z-30 mt-2 min-w-44 rounded-xl border border-black/[.08] bg-white p-1.5 shadow-xl">
                <button type="button" role="menuitem" disabled={organizerAnalyticsExporting} onClick={() => organizerAnalyticsExport("pdf")} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3] disabled:cursor-wait disabled:opacity-50">{organizerAnalyticsExporting ? "Generating PDF..." : "Export PDF"}</button>
                <button type="button" role="menuitem" onClick={() => organizerAnalyticsExport("csv")} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]">Export CSV</button>
                <button type="button" role="menuitem" onClick={() => organizerAnalyticsExport("xls")} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-[#F8F6F3]">Export Excel (.xls)</button>
              </div>}
            </div>}
            {(active === "Orders" || active === "Attendees") && renderOrganizerTableExportMenu()}
          </div>

          {active === "Overview" && <><section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total revenue", currency.format(revenue), "Paid orders", "chart", "bg-[#E9E5F3] text-[#756FB8]"],
              ["Tickets sold", ticketsSold.toLocaleString("en-PH"), "Across your events", "ticket", "bg-[#E2ECF4] text-[#6689A3]"],
              ["Total attendees", attendees.length.toLocaleString("en-PH"), `${attendees.filter((person) => person.checkedIn).length} checked in`, "users", "bg-[#E0EADD] text-[#708965]"],
              ["Active events", String(activeEvents), `${draftEvents} drafts`, "calendar", "bg-[#F4E7D3] text-[#A17850]"],
            ].map(([label, value, change, icon, color]) => (
              <article key={label} className="rounded-2xl border border-black/[.055] bg-white p-5 shadow-[0_2px_10px_rgba(20,18,26,.025)]">
                <div className="flex items-center"><div className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon name={icon} className="size-[19px]" /></div></div>
                <p className="mt-6 text-xs font-semibold text-black/40">{label}</p>
                <div className="mt-1.5 flex items-end justify-between gap-2"><p className="text-2xl font-extrabold tracking-tight">{value}</p><span className={`mb-1 text-[11px] font-bold ${change.toString().startsWith("+") ? "text-emerald-600" : "text-black/35"}`}>{change}</span></div>
              </article>
            ))}
          </section>

          <section className="mb-6 overflow-hidden rounded-2xl bg-[#333746] text-white">
            <div className="grid md:grid-cols-[1.1fr_.9fr]">
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <div className="mb-5 flex items-center gap-2"><span className={`size-2 rounded-full ${featuredEvent ? "animate-pulse bg-[#F4DFA6]" : "bg-white/30"}`} /><span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">{featuredEvent ? `Next up · ${daysUntilFeaturedEvent === 0 ? "Today" : daysUntilFeaturedEvent === 1 ? "1 day" : `${daysUntilFeaturedEvent} days`}` : "No upcoming events"}</span></div>
                <h2 className="max-w-lg text-2xl font-extrabold tracking-[-.03em] sm:text-3xl">{featuredEvent?.name || (events.length ? "You're all caught up" : "Create your first event")}</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/50">{featuredEvent ? `${featuredEvent.date} · ${featuredEvent.venue}` : events.length ? "There are no upcoming published events. Publish an event to see it here." : "Create and manage events from your organizer workspace."}</p>
                <div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold text-white/70">
                  {featuredEvent && <><span className="flex items-center gap-2"><Icon name="calendar" className="size-4 text-[#C4BEE5]" />{featuredEvent.date}</span>
                  <span className="flex items-center gap-2"><Icon name="location" className="size-4 text-[#C4BEE5]" />{featuredEvent.venue}</span></>}
                </div>
                <div className="mt-7 flex items-center gap-4">
                  <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-[#F4DFA6]">Manage event <Icon name="arrow" className="size-3.5" /></button>
                  {featuredEvent && <div><p className="text-sm font-extrabold">{featuredEvent.sold.toLocaleString("en-PH")} <span className="font-medium text-white/35">/ {featuredEvent.total.toLocaleString("en-PH")}</span></p><p className="text-[10px] text-white/35">tickets sold</p></div>}
                </div>
              </div>
              <div className="relative min-h-64 overflow-hidden md:min-h-0">
                <img src={eventImage} alt="Audience watching a presentation at a conference" className="absolute inset-0 size-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#333746] via-[#333746]/20 to-transparent" />
                <p className="absolute bottom-3 right-4 text-[9px] text-white/50">Photo by Andrii Leonov · Unsplash</p>
              </div>
            </div>
          </section></>}

          {active === "Orders" && <section className="overflow-hidden rounded-2xl border border-black/[.055] bg-white">
            <div className="border-b border-black/[.06] p-6">
              <div className="flex items-center gap-2 border-b border-black/[.08]">
                <div role="tablist" aria-label="Filter orders by event" className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
                  <button type="button" role="tab" aria-selected={activeOrderEventTab === "overview"} onClick={() => setOrderEventTab("overview")} className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${activeOrderEventTab === "overview" ? "border-[#756FB8] text-[#756FB8]" : "border-transparent text-black/45 hover:text-black/70"}`}>Overview</button>
                  {visibleOrderTabs.map((event) => <button key={event.eventCode} type="button" role="tab" aria-selected={activeOrderEventTab === event.eventCode} onClick={() => setOrderEventTab(event.eventCode)} className={`max-w-56 shrink-0 truncate border-b-2 px-4 py-3 text-xs font-bold transition ${activeOrderEventTab === event.eventCode ? "border-[#756FB8] text-[#756FB8]" : "border-transparent text-black/45 hover:text-black/70"}`}>{event.name}</button>)}
                </div>
                <button type="button" aria-label="Choose events shown in order tabs" title="Configure event tabs" onClick={() => setEventTabSettingsSection("orders")} className="grid size-9 shrink-0 place-items-center rounded-xl text-black/45 transition hover:bg-[#F8F6F3] hover:text-[#756FB8]"><Icon name="settings" className="size-5" /></button>
              </div>
              <div className="mt-4"><h2 className="text-lg font-extrabold">Recent orders</h2><p className="mt-1 text-xs text-black/40">Review payments{activeOrderEventTab !== "overview" ? ` · ${visibleOrderTabs.find((event) => event.eventCode === activeOrderEventTab)?.name || ""}` : ""}.</p></div>
            </div>
            <div className="divide-y divide-black/[.05]">
              {visibleOrders.map((order) => <div key={order.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7E6F2] text-[#756FB8]"><Icon name="ticket" className="size-5" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{order.buyer}</p><p className="mt-1 truncate text-[11px] text-black/40">{order.number} · {order.event}</p></div>
                <p className="text-sm font-extrabold">{order.amount}</p>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-[#F2DDD5] text-[#9b5f50]"}`}>{order.status}</span>
              </div>)}
              {visibleOrders.length === 0 && <p className="p-6 text-sm text-black/45">{activeOrderEventTab !== "overview" ? "No orders for this event yet." : "No orders yet."}</p>}
            </div>
          </section>}

          {active === "Attendees" && <section className="overflow-hidden rounded-2xl border border-black/[.055] bg-white">
            <div className="border-b border-black/[.06] p-6">
              <div className="flex items-center gap-2 border-b border-black/[.08]">
                <div role="tablist" aria-label="Filter attendees by event" className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
                  <button type="button" role="tab" aria-selected={activeAttendeeEventTab === "overview"} onClick={() => setAttendeeEventTab("overview")} className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${activeAttendeeEventTab === "overview" ? "border-[#756FB8] text-[#756FB8]" : "border-transparent text-black/45 hover:text-black/70"}`}>Overview</button>
                  {visibleAttendeeTabs.map((event) => <button key={event.eventCode} type="button" role="tab" aria-selected={activeAttendeeEventTab === event.eventCode} onClick={() => setAttendeeEventTab(event.eventCode)} className={`max-w-56 shrink-0 truncate border-b-2 px-4 py-3 text-xs font-bold transition ${activeAttendeeEventTab === event.eventCode ? "border-[#756FB8] text-[#756FB8]" : "border-transparent text-black/45 hover:text-black/70"}`}>{event.name}</button>)}
                </div>
                <button type="button" aria-label="Choose events shown in attendee tabs" title="Configure event tabs" onClick={() => setEventTabSettingsSection("attendees")} className="grid size-9 shrink-0 place-items-center rounded-xl text-black/45 transition hover:bg-[#F8F6F3] hover:text-[#756FB8]"><Icon name="settings" className="size-5" /></button>
              </div>
              <div className="mt-4"><h2 className="text-lg font-extrabold">Attendee check-in</h2><p className="mt-1 text-xs text-black/40">{visibleAttendees.filter((person) => person.checkedIn).length} of {visibleAttendees.length} guests checked in{activeAttendeeEventTab !== "overview" ? ` · ${visibleAttendeeTabs.find((event) => event.eventCode === activeAttendeeEventTab)?.name || ""}` : ""}.</p></div>
            </div>
            <div className="divide-y divide-black/[.05]">
              {visibleAttendees.map((person) => {
                const attendeeEvent = events.find((event) => event.eventCode === person.eventCode || event.id === person.eventId);
                const canCheckInToday = attendeeEvent
                  ? isEventDateToday(attendeeEvent)
                  : isEventDateToday({ date: person.date, endDate: person.endDate, multipleDay: Boolean(person.endDate) });
                return <div key={person.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#DFE7F2] text-xs font-extrabold text-[#6689A3]">{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">{person.name}</p><p className="mt-1 truncate text-[11px] text-black/40">{person.ticket} · {person.event}</p></div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <button
                      onClick={() => toggleAttendee(person)}
                      disabled={!person.checkedIn && !canCheckInToday}
                      title={!person.checkedIn && !canCheckInToday ? "Check-in is available only on the event date." : ""}
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${person.checkedIn ? "bg-[#E0EADD] text-[#597450]" : "bg-[#756FB8] text-white"}`}
                    >
                      {person.checkedIn ? "Checked in" : "Check in"}
                    </button>
                    {!person.checkedIn && !canCheckInToday && <span className="text-[10px] text-black/40">Available on event date</span>}
                  </div>
                </div>;
              })}
              {visibleAttendees.length === 0 && <p className="p-6 text-sm text-black/45">{activeAttendeeEventTab !== "overview" ? "No attendees for this event yet." : "No attendees yet."}</p>}
            </div>
          </section>}

          {active === "Analytics" && <section className="rounded-2xl border border-black/[.055] bg-white p-6 sm:p-8">
            {organizerAnalyticsExportError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{organizerAnalyticsExportError}</p>}
            <div className="flex items-center gap-2 border-b border-black/[.07]">
              <div role="tablist" aria-label="Choose event analytics" className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              <button
                type="button"
                role="tab"
                aria-selected={!selectedAnalyticsEvent}
                onClick={() => setAnalyticsEventTab("overview")}
                className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${!selectedAnalyticsEvent ? "border-[#756FB8] text-[#756FB8]" : "border-transparent text-black/45 hover:text-black/70"}`}
              >
                Overview
              </button>
              {analyticsTabEvents.map((event) => <button
                key={event.eventCode}
                type="button"
                role="tab"
                aria-selected={selectedAnalyticsEvent?.eventCode === event.eventCode}
                onClick={() => setAnalyticsEventTab(event.eventCode)}
                className={`max-w-56 shrink-0 truncate border-b-2 px-4 py-3 text-xs font-bold transition ${selectedAnalyticsEvent?.eventCode === event.eventCode ? "border-[#756FB8] text-[#756FB8]" : "border-transparent text-black/45 hover:text-black/70"}`}
              >
                {event.name}
              </button>)}
              </div>
              <button
                type="button"
                aria-label="Choose events shown in analytics tabs"
                title="Configure event tabs"
                onClick={() => setEventTabSettingsSection("analytics")}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-black/45 transition hover:bg-[#F8F6F3] hover:text-[#756FB8]"
              >
                <Icon name="settings" className="size-5" />
              </button>
            </div>
            <section aria-labelledby="revenue-analytics-title" className="mt-6 rounded-2xl border border-black/[.06] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="revenue-analytics-title" className="text-lg font-extrabold">Revenue Analytics</h2>
                  <p className="mt-1 text-xs text-black/40">
                    {selectedAnalyticsEvent ? `Paid ticket revenue for ${selectedAnalyticsEvent.name}.` : "Paid ticket revenue across the events shown in Analytics."}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-black/50">
                  <span>Group by</span>
                  <select
                    aria-label="Revenue analytics period"
                    value={revenueAnalyticsPeriod}
                    onChange={(event) => setRevenueAnalyticsPeriod(event.target.value)}
                    className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-[#2D3142] outline-none focus:border-[#756FB8]"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold">{currency.format(revenueGrowthTotal)}</p>
                  <p className="mt-1 text-xs text-black/40">Revenue in selected period</p>
                </div>
                <p className="text-xs text-black/45">All-time paid revenue: <span className="font-bold text-[#2D3142]">{currency.format(analyticsRevenue)}</span></p>
              </div>
              {revenueGrowthTotal > 0
                ? <div className="mt-4 w-full overflow-x-auto">
                  <svg
                    viewBox="0 0 720 240"
                    role="img"
                    aria-label={`Revenue analytics, grouped by ${revenueAnalyticsPeriod}, ${currency.format(revenueGrowthTotal)} in paid ticket revenue`}
                    className="h-64 min-w-[600px] w-full"
                  >
                    {[0, 1, 2, 3].map((tick) => {
                      const y = 190 - tick * (160 / 3);
                      const value = revenueGrowthMax * tick / 3;
                      return <g key={tick}>
                        <line x1="48" y1={y} x2="708" y2={y} stroke="#EAE8E5" strokeDasharray={tick === 0 ? "0" : "4 5"} />
                        <text x="42" y={y + 4} textAnchor="end" className="fill-black/40 text-[9px]">{value >= 1000 ? `₱${(value / 1000).toFixed(1)}k` : `₱${Math.round(value)}`}</text>
                      </g>;
                    })}
                    <polygon points={`48,190 ${revenueChartLine} 708,190`} fill="url(#revenue-growth-fill)" />
                    <polyline points={revenueChartLine} fill="none" stroke="#756FB8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {revenueChart.map((point) => <g key={point.key}>
                      <circle cx={point.x} cy={point.y} r="4" fill="white" stroke="#756FB8" strokeWidth="2">
                        <title>{`${point.label}: ${currency.format(point.revenue)}`}</title>
                      </circle>
                    </g>)}
                    {revenueChart.map((point, index) => {
                      const labelInterval = revenueAnalyticsPeriod === "day" ? 3 : 1;
                      if (index % labelInterval !== 0 && index !== revenueChart.length - 1) return null;
                      return <text key={point.key} x={point.x} y="218" textAnchor="middle" className="fill-black/45 text-[10px]">{point.label}</text>;
                    })}
                    <defs>
                      <linearGradient id="revenue-growth-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#756FB8" stopOpacity=".2" />
                        <stop offset="100%" stopColor="#756FB8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                : <p className="mt-5 rounded-xl bg-[#F8F6F3] p-4 text-xs text-black/45">No paid ticket revenue recorded for this period.</p>}
              <p className="mt-3 text-[11px] text-black/40">
                {revenueAnalyticsPeriod === "day" ? "Hourly revenue across the 24 hours of today." : revenueAnalyticsPeriod === "week" ? "Daily revenue across this 7-day week." : "Weekly revenue across the current month."}
              </p>
            </section>
            <div className="mt-6"><h2 className="text-lg font-extrabold">Ticket performance</h2><p className="mt-1 text-xs text-black/40">{selectedAnalyticsEvent ? `Performance for ${selectedAnalyticsEvent.name}.` : "Performance across your published events."}</p></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Tickets sold", `${analyticsTicketsSold.toLocaleString("en-PH")} / ${analyticsCapacity.toLocaleString("en-PH")}`],
                ["Attendees", analyticsAttendees.length.toLocaleString("en-PH")],
                ["Checked in", analyticsAttendees.filter((person) => person.checkedIn).length.toLocaleString("en-PH")],
                ["Paid revenue", currency.format(analyticsRevenue)],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-[#F8F6F3] p-4">
                <p className="text-[11px] font-semibold text-black/40">{label}</p>
                <p className="mt-2 text-lg font-extrabold">{value}</p>
              </div>)}
            </div>
            <div className="mt-8 space-y-6">
              {analyticsEvents.map((event) => { const percent = event.total > 0 ? Math.round((event.sold / event.total) * 100) : 0; return <div key={event.id}><div className="mb-2 flex items-center justify-between gap-4"><p className="truncate text-xs font-bold">{event.name}</p><p className="shrink-0 text-xs font-extrabold text-[#756FB8]">{percent}% · {event.sold}/{event.total}</p></div><div className="h-3 overflow-hidden rounded-full bg-black/[.05]"><div className="h-full rounded-full bg-[#756FB8] transition-all" style={{ width: `${Math.min(percent, 100)}%` }} /></div></div>; })}
            </div>
            <section aria-labelledby="registration-growth-title" className="mt-8 rounded-2xl border border-black/[.06] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="registration-growth-title" className="text-lg font-extrabold">Registration Growth Over Time</h2>
                  <p className="mt-1 text-xs text-black/40">
                    {selectedAnalyticsEvent ? `New registrations for ${selectedAnalyticsEvent.name}.` : "New registrations across the events shown in Analytics."}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-black/50">
                  <span>Group by</span>
                  <select
                    aria-label="Registration growth period"
                    value={analyticsPeriod}
                    onChange={(event) => setAnalyticsPeriod(event.target.value)}
                    className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold text-[#2D3142] outline-none focus:border-[#756FB8]"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold">{registrationGrowthTotal.toLocaleString("en-PH")}</span>
                <span className="text-xs text-black/40">registrations in the selected period</span>
              </div>
              {registrationGrowth.length > 0 && <div className="mt-3 w-full overflow-x-auto">
                <svg
                  viewBox="0 0 720 240"
                  role="img"
                  aria-label={`Registration growth, grouped by ${analyticsPeriod}, ${registrationGrowthTotal} registrations`}
                  className="h-64 min-w-[600px] w-full"
                >
                  {[0, 1, 2, 3].map((tick) => {
                    const y = 190 - tick * (160 / 3);
                    const value = Math.round(registrationGrowthMax * tick / 3);
                    return <g key={tick}>
                      <line x1="48" y1={y} x2="708" y2={y} stroke="#EAE8E5" strokeDasharray={tick === 0 ? "0" : "4 5"} />
                      <text x="38" y={y + 4} textAnchor="end" className="fill-black/40 text-[10px]">{value}</text>
                    </g>;
                  })}
                  <polygon points={`48,190 ${registrationChartLine} 708,190`} fill="url(#registration-growth-fill)" />
                  <polyline points={registrationChartLine} fill="none" stroke="#756FB8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {registrationChart.map((point) => <g key={point.key}>
                    <circle cx={point.x} cy={point.y} r="4" fill="white" stroke="#756FB8" strokeWidth="2">
                      <title>{`${point.label}: ${point.registrations} registrations`}</title>
                    </circle>
                  </g>)}
                  {registrationChart.map((point, index) => {
                    const labelInterval = analyticsPeriod === "day" ? 3 : 1;
                    if (index % labelInterval !== 0 && index !== registrationChart.length - 1) return null;
                    return <text key={point.key} x={point.x} y="218" textAnchor="middle" className="fill-black/45 text-[10px]">{point.label}</text>;
                  })}
                  <defs>
                    <linearGradient id="registration-growth-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#756FB8" stopOpacity=".2" />
                      <stop offset="100%" stopColor="#756FB8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>}
              {registrationGrowthTotal === 0 && <p className="mt-2 text-xs text-black/40">No registrations recorded for this period.</p>}
              <p className="mt-3 text-[11px] text-black/40">
                {analyticsPeriod === "day" ? "Hourly registrations across the 24 hours of today." : analyticsPeriod === "week" ? "Daily registrations across this 7-day week." : "Weekly registrations across the current month."}
              </p>
            </section>
            <section aria-labelledby="check-in-activity-title" className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-black/[.06] p-5 sm:p-6">
                <h2 id="check-in-activity-title" className="text-lg font-extrabold">Check-in Activity</h2>
                <p className="mt-1 text-xs text-black/40">
                  {selectedAnalyticsEvent ? `Attendance status for ${selectedAnalyticsEvent.name}.` : "Attendance status across the events shown in Analytics."}
                </p>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-extrabold">{checkInSummary.checkedIn.toLocaleString("en-PH")}</p>
                    <p className="mt-1 text-xs text-black/45">attendees checked in</p>
                  </div>
                  <p className="text-sm font-extrabold text-[#756FB8]">{checkInRate}%</p>
                </div>
                <div
                  role="progressbar"
                  aria-label="Attendee check-in rate"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={checkInRate}
                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/[.06]"
                >
                  <div className="h-full rounded-full bg-[#756FB8] transition-all" style={{ width: `${checkInRate}%` }} />
                </div>
                <p className="mt-3 text-[11px] text-black/40">
                  {checkInSummary.notYetCheckedIn.toLocaleString("en-PH")} not checked in yet · {checkInSummary.noShow.toLocaleString("en-PH")} no-shows
                </p>
              </article>
              <article className="rounded-2xl border border-black/[.06] p-5 sm:p-6">
                <h2 className="text-lg font-extrabold">Check-ins & No-shows</h2>
                <p className="mt-1 text-xs text-black/40">No-shows count unchecked attendees only after their event has ended.</p>
                <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                  <div
                    role="img"
                    aria-label={`Attendance breakdown: ${checkInSummary.checkedIn} checked in, ${checkInSummary.noShow} no-shows, ${checkInSummary.notYetCheckedIn} not checked in yet`}
                    className="relative size-36 shrink-0 rounded-full"
                    style={checkInPieStyle}
                  >
                    <div className="absolute inset-4 grid place-content-center rounded-full bg-white text-center">
                      <span className="text-2xl font-extrabold">{checkInTotal.toLocaleString("en-PH")}</span>
                      <span className="text-[10px] text-black/40">attendees</span>
                    </div>
                  </div>
                  <ul className="w-full space-y-3 text-xs">
                    {[
                      ["Checked in", checkInSummary.checkedIn, "#756FB8"],
                      ["No-show", checkInSummary.noShow, "#D97764"],
                      ["Not checked in yet", checkInSummary.notYetCheckedIn, "#E8E5DF"],
                    ].map(([label, count, color]) => <li key={label} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-black/55"><span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                      <span className="font-bold">{count.toLocaleString("en-PH")}{checkInTotal ? ` · ${Math.round((count / checkInTotal) * 100)}%` : ""}</span>
                    </li>)}
                  </ul>
                </div>
              </article>
            </section>
            <section aria-labelledby="discovery-source-title" className="mt-4 rounded-2xl border border-black/[.06] p-5 sm:p-6">
              <h2 id="discovery-source-title" className="text-lg font-extrabold">How Attendees Heard About the Event</h2>
              <p className="mt-1 text-xs text-black/40">
                {selectedAnalyticsEvent ? `Registration sources for ${selectedAnalyticsEvent.name}.` : "Registration sources across the events shown in Analytics."}
              </p>
              {discoverySourceCounts.length > 0 ? <ol aria-label="Attendee discovery sources" className="mt-5 space-y-4">
                {discoverySourceCounts.map((source) => (
                  <li key={source.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 text-xs">
                    <span className="truncate font-semibold text-black/65" title={source.label}>{source.label}</span>
                    <span className="font-bold tabular-nums">{source.count.toLocaleString("en-PH")} <span className="font-normal text-black/40">· {Math.round((source.count / analyticsAttendees.length) * 100)}%</span></span>
                    <div
                      role="img"
                      aria-label={`${source.label}: ${source.count} attendee${source.count === 1 ? "" : "s"}`}
                      className="col-span-2 h-3 overflow-hidden rounded-full bg-black/[.05]"
                    >
                      <div className="h-full rounded-full bg-[#756FB8] transition-all" style={{ width: `${(source.count / discoverySourceMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol> : <p className="mt-5 text-xs text-black/40">No attendee registration sources recorded yet.</p>}
            </section>
            {analyticsTabEvents.length === 0 && <p className="mt-6 rounded-xl bg-[#F8F6F3] p-5 text-sm text-black/45">Publish an event to see its analytics here.</p>}
            {analyticsTabEvents.length > 0 && <div className="mt-8 rounded-2xl bg-[#F8F6F3] p-5 text-xs leading-5 text-black/55">Showing ticket performance for {selectedAnalyticsEvent ? selectedAnalyticsEvent.name : `${analyticsTabEvents.length} published event${analyticsTabEvents.length === 1 ? "" : "s"}`}.</div>}
          </section>}

          {(active === "Overview" || active === "Events") && <section className="rounded-2xl border border-black/[.055] bg-white shadow-[0_2px_10px_rgba(20,18,26,.025)]">
            <div className="flex flex-col gap-4 border-b border-black/[.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><h2 className="text-lg font-extrabold tracking-tight">{archiveView ? "Event archive" : "Your events"}</h2><p className="mt-1 text-xs text-black/40">{archiveView ? "Completed, finished, and cancelled events" : "Manage your upcoming schedule"}</p></div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:hidden"><Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-black/10 pl-9 pr-3 text-xs outline-none" placeholder="Search" /></div>
                <select value={archiveView ? filter : filter === "All archived" ? "All events" : filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-black/[.08] bg-white px-3 text-xs font-semibold outline-none">
                  {archiveView
                    ? <><option>All archived</option><option>Finished</option><option>Cancelled</option></>
                    : <><option>All events</option><option>On sale</option><option>Draft</option></>}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead><tr className="border-b border-black/[.05] text-[10px] font-bold uppercase tracking-[.12em] text-black/35"><th className="px-6 py-4">ID</th><th className="px-4 py-4">Event</th><th className="px-4 py-4">Venue</th><th className="px-4 py-4">Date & time</th><th className="px-4 py-4">Tickets sold</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-center">Actions</th></tr></thead>
                <tbody>
                  {pagedEvents.map((event) => (
                    <tr key={event.id} className="group border-b border-black/[.045] last:border-0 hover:bg-[#F9F7F5]">
                      <td className="px-6 py-4 text-[11px] font-semibold tracking-wide text-[#756FB8]">{event.eventCode || "—"}</td>
                      <td className="w-[240px] px-4 py-4"><p className="text-sm font-bold">{event.name}</p></td>
                      <td className="w-[280px] px-4 py-4"><p className="flex items-center gap-1 text-[11px] text-black/40"><Icon name="location" className="size-3 shrink-0" />{event.venue}</p></td>
                      <td className="px-4 py-4"><p className="text-xs font-semibold">{event.multipleDay && event.endDate ? `${event.date} - ${event.endDate}` : event.date}</p><p className="mt-1 text-[11px] text-black/40">{event.time}</p></td>
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#756FB8]" style={{ width: `${Math.min((event.sold / event.total) * 100, 100)}%` }} /></div><span className="text-[11px] font-semibold text-black/50">{event.sold}/{event.total}</span></div></td>
                      <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${event.status === "On sale" ? "bg-emerald-50 text-emerald-700" : "bg-black/[.05] text-black/45"}`}><span className={`size-1.5 rounded-full ${event.status === "On sale" ? "bg-emerald-500" : "bg-black/30"}`} />{event.status}</span></td>
                      <td className="px-6 py-4"><div className="flex justify-center gap-1">
                        {!archiveView && event.status === "Draft" && <button onClick={() => publishEvent(event)} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">Publish</button>}
                        {event.status === "On sale" && event.eventCode && <button onClick={async () => { try { await navigator.clipboard.writeText(event.registrationUrl || `${window.location.origin}/events/${event.eventCode}`); setNotice("Public event link copied."); } catch { setNotice("Unable to copy the event link. Open the event page and copy its URL."); } window.setTimeout(() => setNotice(""), 3200); }} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">Copy link</button>}
                        {!archiveView && <button onClick={() => { setEditingEvent(event.id); setEventFormStep(1); setEventFormBasics({}); setMultipleDay(event.multipleDay === true); setPricingMode(event.pricingMode || "free"); setEventPrice(event.priceCents ? (event.priceCents / 100).toFixed(2) : ""); setTicketTypes(event.ticketTypes?.length ? event.ticketTypes.map((ticket) => ({ id: ticket.id, name: ticket.name, price: (ticket.priceCents / 100).toFixed(2) })) : [{ id: "", name: "General Admission", price: "" }, { id: "", name: "VIP", price: "" }]); setEventStartDate(toDateInputValue(event.date)); setEventEndDate(event.endDate || ""); setVenueInput(event.venue); setVenueSelected(true); setVenueSuggestions([]); setVenueSuggestionError(""); setModalOpen(true); }} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-[#756FB8] hover:bg-[#E7E6F2]">Edit</button>}
                        {event.status === "On sale" && <button disabled={!hasEventEnded(event)} title={hasEventEnded(event) ? "Mark this event as finished" : "Available after the event end date and time"} onClick={() => setActionConfirmation({ type: "finish", event })} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40">Finish</button>}
                        {!archiveView && !hasEventStartDatePassed(event, currentTime) && <button onClick={() => setActionConfirmation({ type: "cancel", event })} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50">Cancel</button>}
                        {archiveView && <span className="px-2.5 py-2 text-[10px] font-semibold text-black/35">Archived</span>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-14 text-center"><p className="font-bold">{archiveView ? "No archived events yet" : "No events found"}</p><p className="mt-1 text-xs text-black/40">{archiveView ? "Finished and cancelled events will appear here." : "Try another search or filter."}</p></div>}
            </div>
            <div className="flex items-center justify-between border-t border-black/[.05] px-6 py-4"><p className="text-[11px] text-black/40">Showing {filtered.length ? (page - 1) * 3 + 1 : 0}–{Math.min(page * 3, filtered.length)} of {filtered.length} events</p><div className="flex gap-1"><button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid size-8 place-items-center rounded-lg border border-black/[.07] text-black/50 disabled:opacity-25"><Icon name="arrow" className="size-3 rotate-180" /></button><button className="grid size-8 place-items-center rounded-lg bg-[#756FB8] text-[11px] font-bold text-white">{page}</button><button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="grid size-8 place-items-center rounded-lg border border-black/[.07] text-black/50 disabled:opacity-25"><Icon name="arrow" className="size-3" /></button></div></div>
          </section>}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2D3142]/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-7 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#756FB8]">{editingEvent ? "Edit event" : "New event"} · Step {eventFormStep} of 2</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight">{eventFormStep === 1 ? (editingEvent ? "Update event details" : "Create something memorable") : "Tell us about your event"}</h2></div><button className="rounded-xl bg-black/[.04] p-2 text-black/50 hover:bg-black/[.08]" onClick={() => { setModalOpen(false); setEditingEvent(null); setEventFormStep(1); setEventFormBasics({}); }} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={saveEvent} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <fieldset disabled={eventFormStep !== 1} className={eventFormStep === 1 ? "contents" : "hidden"}>
              <label className="block"><span className="mb-2 block text-xs font-bold">Event name <span className="text-rose-600">*</span></span><input name="name" required maxLength={120} autoFocus defaultValue={selectedEvent?.name} placeholder="e.g. Philippine Tech Expo" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8] focus:ring-4 focus:ring-[#756FB8]/10" /></label>
              <label className="block"><span className="mb-2 block text-xs font-bold">Category <span className="text-rose-600">*</span></span><input name="category" required maxLength={100} defaultValue={selectedEvent?.category} placeholder="e.g. Conference, Music, Workshop" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
              <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 md:col-span-2">
                <legend className="sr-only">Is this a multiple-day event?</legend>
                <span className="text-xs font-bold">Is this a multiple-day event? <span className="text-rose-600">*</span></span>
                <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="multipleDay" value="true" required checked={multipleDay === true} onChange={() => setMultipleDay(true)} className="accent-[#756FB8]" />Yes</label>
                <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="multipleDay" value="false" required checked={multipleDay === false} onChange={() => setMultipleDay(false)} className="accent-[#756FB8]" />No</label>
                <span className="ml-[126px] text-[11px] leading-5 text-black/40">This category is only used in your organizer workspace.</span>
              </fieldset>
              <div className={`grid grid-cols-1 gap-4 md:col-span-2 ${multipleDay ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                <label className="block"><span className="mb-2 block text-xs font-bold">Start date <span className="text-rose-600">*</span></span><input name="date" type="date" required min={getTodayDateInputValue()} value={eventStartDate} onChange={(event) => setEventStartDate(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
                {multipleDay && <label className="block"><span className="mb-2 block text-xs font-bold">End date <span className="text-rose-600">*</span></span><input name="endDate" type="date" required min={eventStartDate || getTodayDateInputValue()} value={eventEndDate} onChange={(event) => setEventEndDate(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>}
                <label className="block"><span className="mb-2 block text-xs font-bold">Time <span className="text-rose-600">*</span></span><input name="time" type="time" required defaultValue={selectedEvent ? toTimeInputValue(selectedEvent.time) : ""} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
              </div>
              <label className="relative block"><span className="mb-2 block text-xs font-bold">Venue in the Philippines <span className="text-rose-600">*</span></span><input name="venue" required maxLength={200} value={venueInput} onChange={(event) => { setVenueInput(event.target.value); setVenueSelected(false); setVenueSuggestions([]); setVenueSuggestionsLoading(event.target.value.trim().length >= 3); setVenueSuggestionError(""); }} placeholder="Type at least 3 characters to find a venue" autoComplete="off" aria-autocomplete="list" aria-expanded={venueSuggestions.length > 0} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" />
                {venueSuggestionsLoading && <span className="mt-1 block text-[11px] text-black/40">Searching Philippines venues…</span>}
                {venueSuggestions.length > 0 && <ul role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-black/10 bg-white py-1 shadow-lg">{venueSuggestions.map((suggestion) => <li key={suggestion} role="option" aria-selected="false"><button type="button" onClick={() => { setVenueInput(suggestion); setVenueSelected(true); setVenueSuggestions([]); setVenueSuggestionError(""); }} className="w-full px-4 py-2 text-left text-sm hover:bg-[#F8F6F3]">{suggestion}</button></li>)}</ul>}
                {venueSuggestionError && <span role="alert" className="mt-1 block text-[11px] text-rose-600">{venueSuggestionError}</span>}
                {!venueSuggestionError && venueInput.trim().length >= 3 && !venueSuggestionsLoading && venueSuggestions.length === 0 && !venueSelected && <span className="mt-1 block text-[11px] text-black/40">No Philippine venue suggestions found.</span>}
              </label>
              <label className="block"><span className="mb-2 block text-xs font-bold">Maximum Capacity <span className="text-rose-600">*</span></span><input name="capacity" type="number" min="1" max="100000" required defaultValue={selectedEvent?.total} placeholder="100" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
              </fieldset>
              <fieldset disabled={eventFormStep !== 2} className={eventFormStep === 2 ? "contents" : "hidden"}>
              <fieldset className="space-y-3 rounded-2xl border border-black/10 p-4 md:col-span-2">
                <legend className="px-1 text-xs font-bold">Ticket pricing <span className="text-rose-600">*</span></legend>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {[
                    ["free", "Free"],
                    ["single", "One ticket price"],
                    ["multiple", "Multiple ticket types"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name="pricingMode" value={value} checked={pricingMode === value} onChange={() => setPricingMode(value)} className="accent-[#756FB8]" />
                      {label}
                    </label>
                  ))}
                </div>
                {pricingMode === "single" && <label className="block max-w-xs"><span className="mb-2 block text-xs font-bold">Ticket price (PHP) <span className="text-rose-600">*</span></span><input type="number" required min="0.01" max="1000000" step="0.01" value={eventPrice} onChange={(event) => setEventPrice(event.target.value)} placeholder="500.00" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>}
                {pricingMode === "multiple" && <div className="space-y-3">
                  {ticketTypes.map((ticket, index) => <div key={ticket.id || index} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                    <label><span className="mb-2 block text-xs font-bold">Ticket type {index + 1} name <span className="text-rose-600">*</span></span><input required maxLength={80} value={ticket.name} onChange={(event) => setTicketTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="e.g. General Admission" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
                    <label><span className="mb-2 block text-xs font-bold">Price (PHP) <span className="text-rose-600">*</span></span><input type="number" required min="0.01" max="1000000" step="0.01" value={ticket.price} onChange={(event) => setTicketTypes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} placeholder="500.00" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
                    <div className="flex items-end">{ticketTypes.length > 2 && <button type="button" onClick={() => setTicketTypes((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="h-12 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50">Remove</button>}</div>
                  </div>)}
                  {ticketTypes.length < 10 && <button type="button" onClick={() => setTicketTypes((current) => [...current, { id: "", name: "", price: "" }])} className="rounded-xl border border-[#756FB8]/30 px-4 py-2.5 text-xs font-bold text-[#756FB8] hover:bg-[#756FB8]/5">Add ticket type</button>}
                </div>}
              </fieldset>
              <label className="block md:col-span-2"><span className="mb-2 block text-xs font-bold">Brief us about the event <span className="text-rose-600">*</span></span><textarea name="description" required maxLength={5000} rows={3} defaultValue={selectedEvent?.description} placeholder="Describe what attendees can expect..." className="w-full resize-y rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#756FB8]" /></label>
              <label className="block md:col-span-2"><span className="mb-2 block text-xs font-bold">Who will be the headliner or organizer? <span className="text-rose-600">*</span></span><input name="headliner" required maxLength={150} defaultValue={selectedEvent?.headliner} placeholder="Enter a headliner or organizer" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
              </fieldset>
              <div className="flex justify-between gap-3 pt-3 md:col-span-2">
                <div>
                  {eventFormStep === 2 && <button type="button" onClick={() => setEventFormStep(1)} className="rounded-xl border border-black/10 px-5 py-3 text-sm font-bold text-black/55 transition hover:bg-black/[.03]">Back</button>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setModalOpen(false); setEditingEvent(null); setEventFormStep(1); setEventFormBasics({}); }} className="rounded-xl px-5 py-3 text-sm font-bold text-black/50 hover:bg-black/[.04]">Cancel</button>
                  <button type="submit" className="rounded-xl bg-[#756FB8] px-5 py-3 text-sm font-bold text-white hover:bg-[#625CA4]">{eventFormStep === 1 ? "Next" : editingEvent ? "Save changes" : "Create Event"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {utilityModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#2D3142]/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && setUtilityModal("")}
          onKeyDown={(event) => event.key === "Escape" && setUtilityModal("")}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-[#756FB8]">Organizer workspace</p>
                <h2 id="workspace-modal-title" className="mt-2 text-2xl font-extrabold tracking-tight">
                  {utilityModal === "help" ? "Help center" : utilityModal === "profile" ? "Your profile" : "Settings"}
                </h2>
                <p className="mt-2 text-xs leading-5 text-black/45">
                  {utilityModal === "help"
                    ? "Find answers to common questions about your workspace."
                    : utilityModal === "profile"
                      ? "Your Gatherly account details."
                      : "Manage your workspace notification preferences."}
                </p>
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                {utilityModal === "profile" && <>
                  <button
                    type="button"
                    onClick={() => { setProfileAction("edit"); setProfileName(user.name); setProfileError(""); setProfileMessage(""); }}
                    className="rounded-xl border border-[#756FB8]/25 px-3 py-2 text-xs font-bold text-[#625CA4] transition hover:bg-[#E7E6F2]"
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileAction("password"); setCurrentPassword(""); setCurrentPasswordCheck({ state: "empty", value: "", message: "" }); setNewPassword(""); setNewPasswordCheck({ state: "empty", value: "", message: "" }); setConfirmNewPassword(""); setProfileError(""); setProfileMessage(""); }}
                    className="rounded-xl bg-[#756FB8] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#625CA4]"
                  >
                    Change password
                  </button>
                </>}
                <button onClick={() => setUtilityModal("")} className="rounded-xl bg-black/[.04] p-2 text-black/50 transition hover:bg-black/[.08]" aria-label="Close dialog">
                  <Icon name="close" />
                </button>
              </div>
            </div>

            {utilityModal === "profile" && (
              <div className="grid gap-5 sm:grid-cols-[.8fr_1.2fr]">
                <article className="rounded-2xl bg-[#333746] p-6 text-white">
                  <div className="grid size-16 place-items-center rounded-2xl bg-[#F4DFA6] text-xl font-extrabold text-[#2D3142]">{userInitials}</div>
                  <h3 className="mt-5 text-lg font-extrabold">{user.name}</h3>
                  <p className="mt-1 break-all text-xs text-white/55">{user.email}</p>
                  <div className="mt-5 rounded-xl bg-white/[.07] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40">Account type</p>
                    <p className="mt-2 text-sm font-bold">{user.accountType === "admin" ? "Administrator" : "Organizer"}</p>
                  </div>
                </article>
                <div className="rounded-2xl border border-black/[.06] p-6">
                  {profileAction === "edit" ? <form onSubmit={saveProfile}>
                    <h3 className="text-sm font-extrabold">Edit profile</h3>
                    <label className="mt-5 block">
                      <span className="mb-2 block text-[11px] font-semibold text-black/45">Full name</span>
                      <input value={profileName} onChange={(event) => setProfileName(event.target.value)} required maxLength={100} autoComplete="name" className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#756FB8]" />
                    </label>
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold text-black/40">Email address</p>
                      <p className="mt-1 break-all text-sm font-bold">{user.email}</p>
                    </div>
                    <p className="mt-5 rounded-xl bg-[#F8F6F3] p-4 text-xs leading-5 text-black/50">Your verified email is used to sign in and cannot be changed here.</p>
                    {profileError && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{profileError}</p>}
                    <div className="mt-5 flex justify-end gap-2">
                      <button type="button" onClick={() => { setProfileAction(""); setProfileError(""); }} className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-black/60 transition hover:bg-black/[.03]">Cancel</button>
                      <button type="submit" disabled={profileSubmitting} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#625CA4] disabled:opacity-50">{profileSubmitting ? "Saving..." : "Save changes"}</button>
                    </div>
                  </form> : profileAction === "password" ? <form onSubmit={changePassword}>
                    <h3 className="text-sm font-extrabold">Change password</h3>
                    <div className="mt-5 space-y-4">
                      {[
                        ["current", "Current password", currentPassword, setCurrentPassword, "current-password", false],
                        ["new", "New password", newPassword, setNewPassword, "new-password", true],
                        ["confirm", "Confirm new password", confirmNewPassword, setConfirmNewPassword, "new-password", true],
                      ].map(([key, label, value, setValue, autoComplete, validate]) => <label key={key} className="block">
                        <span className="mb-2 block text-[11px] font-semibold text-black/45">{label}</span>
                        <span className="relative block">
                          <input
                            type={passwordVisibility[key] ? "text" : "password"}
                            value={value}
                            onChange={(event) => {
                              const value = event.target.value;
                              setValue(value);
                              if (key === "current") {
                                setCurrentPasswordCheck({
                                  state: value ? "checking" : "empty",
                                  value,
                                  message: value ? "Checking current password..." : "",
                                });
                              } else if (key === "new") {
                                const meetsRequirements = getPasswordRequirements(value).every(([, met]) => met);
                                setNewPasswordCheck({
                                  state: !value ? "empty" : meetsRequirements ? "checking" : "incomplete",
                                  value,
                                  message: !value
                                    ? ""
                                    : meetsRequirements
                                      ? "Checking against your current password..."
                                      : "Complete the password requirements to check it.",
                                });
                              }
                            }}
                            required
                            {...(validate ? { minLength: 8, maxLength: 128 } : {})}
                            autoComplete={autoComplete}
                            className="h-11 w-full rounded-xl border border-black/10 px-3 pr-11 text-sm outline-none focus:border-[#756FB8]"
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordVisibility((current) => ({ ...current, [key]: !current[key] }))}
                            aria-label={`${passwordVisibility[key] ? "Hide" : "Show"} ${label.toLowerCase()}`}
                            aria-pressed={passwordVisibility[key]}
                            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-black/40 transition hover:text-[#625CA4]"
                          >
                            <Icon name={passwordVisibility[key] ? "eyeOff" : "eye"} className="size-[18px]" />
                          </button>
                        </span>
                        {key === "current" && currentPasswordCheck.value === currentPassword && currentPasswordCheck.message && <span
                          role={currentPasswordCheck.state === "invalid" || currentPasswordCheck.state === "error" ? "alert" : "status"}
                          className={`mt-1.5 block text-[11px] font-semibold ${currentPasswordCheck.state === "valid" ? "text-emerald-700" : currentPasswordCheck.state === "checking" ? "text-black/40" : "text-rose-600"}`}
                        >
                          {currentPasswordCheck.message}
                        </span>}
                        {key === "confirm" && confirmNewPassword && <span
                          role={newPassword === confirmNewPassword ? "status" : "alert"}
                          className={`mt-1.5 block text-[11px] font-semibold ${newPassword === confirmNewPassword ? "text-emerald-700" : "text-rose-600"}`}
                        >
                          {newPassword === confirmNewPassword ? "Passwords match." : "Passwords do not match."}
                        </span>}
                      </label>)}
                    </div>
                    {newPasswordCheck.value === newPassword && newPasswordCheck.message && <p
                      role={newPasswordCheck.state === "same" || newPasswordCheck.state === "error" ? "alert" : "status"}
                      className={`mt-2 text-[11px] font-semibold ${newPasswordCheck.state === "different" ? "text-emerald-700" : newPasswordCheck.state === "checking" || newPasswordCheck.state === "incomplete" ? "text-black/40" : "text-rose-600"}`}
                    >
                      {newPasswordCheck.message}
                    </p>}
                    <ul className="mt-3 space-y-1 text-[11px]" aria-label="Password requirements">
                      {getPasswordRequirements(newPassword).map(([requirement, met]) => <li key={requirement} className={met ? "font-semibold text-emerald-700" : "text-black/45"}>{met ? "✓" : "○"} {requirement}</li>)}
                    </ul>
                    {profileError && <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{profileError}</p>}
                    <div className="mt-5 flex justify-end gap-2">
                      <button type="button" onClick={() => { setProfileAction(""); setProfileError(""); }} className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-black/60 transition hover:bg-black/[.03]">Cancel</button>
                      <button type="submit" disabled={profileSubmitting || currentPasswordCheck.state !== "valid" || currentPasswordCheck.value !== currentPassword || newPasswordCheck.state !== "different" || newPasswordCheck.value !== newPassword || !confirmNewPassword || newPassword !== confirmNewPassword} className="rounded-xl bg-[#756FB8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#625CA4] disabled:cursor-not-allowed disabled:opacity-50">{profileSubmitting ? "Updating..." : "Update password"}</button>
                    </div>
                  </form> : <>
                    <h3 className="text-sm font-extrabold">Account information</h3>
                    <dl className="mt-5 space-y-4">
                      <div><dt className="text-[11px] font-semibold text-black/40">Full name</dt><dd className="mt-1 text-sm font-bold">{user.name}</dd></div>
                      <div><dt className="text-[11px] font-semibold text-black/40">Email address</dt><dd className="mt-1 break-all text-sm font-bold">{user.email}</dd></div>
                    </dl>
                    <p className="mt-6 rounded-xl bg-[#F8F6F3] p-4 text-xs leading-5 text-black/50">Your verified email is used to sign in and cannot be changed here.</p>
                    {profileMessage && <p role="status" className="mt-4 text-xs font-semibold text-emerald-700">{profileMessage}</p>}
                  </>}
                </div>
              </div>
            )}

            {utilityModal === "settings" && (
              <div className="rounded-2xl border border-black/[.06] p-6">
                <h3 className="text-base font-extrabold">Notification preferences</h3>
                <p className="mt-1 text-xs leading-5 text-black/40">Choose which workspace updates you want to see.</p>
                <div className="mt-5 divide-y divide-black/[.06]">
                  {[
                    ["orderEmails", "Order updates", "Show updates when ticket orders are recorded."],
                    ["eventReminders", "Event reminders", "Show reminders about your upcoming events."],
                    ["weeklySummary", "Weekly summary", "Show a weekly overview of workspace activity."],
                  ].map(([key, title, description]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="flex-1">
                        <span className="block text-sm font-bold">{title}</span>
                        <span className="mt-1 block text-xs leading-5 text-black/40">{description}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={preferences[key]}
                        onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))}
                        className="size-5 accent-[#756FB8]"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-5 rounded-xl bg-[#F8F6F3] p-4 text-xs leading-5 text-black/45">These preferences are stored for this workspace session; email notification delivery is not configured.</p>
              </div>
            )}

            {utilityModal === "help" && (
              <div>
                <div className="relative">
                  <Icon name="search" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black/35" />
                  <input
                    value={helpSearch}
                    onChange={(event) => setHelpSearch(event.target.value)}
                    placeholder="Search help articles..."
                    className="h-12 w-full rounded-xl border border-black/10 bg-[#F8F6F3] pl-11 pr-4 text-sm outline-none focus:border-[#756FB8]"
                  />
                </div>
                <div className="mt-5 space-y-3">
                  {helpArticles
                    .filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(helpSearch.trim().toLowerCase()))
                    .map(([question, answer]) => (
                      <details key={question} className="group rounded-xl border border-black/[.07] p-4 open:bg-[#F8F6F3]">
                        <summary className="cursor-pointer list-none pr-6 text-sm font-bold">{question}</summary>
                        <p className="mt-3 text-xs leading-6 text-black/50">{answer}</p>
                      </details>
                    ))}
                  {!helpArticles.some(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(helpSearch.trim().toLowerCase())) && (
                    <p className="rounded-xl bg-[#F8F6F3] p-5 text-center text-sm text-black/45">No help articles match that search.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-[#2D3142]/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && setLogoutConfirmOpen(false)}
          onKeyDown={(event) => event.key === "Escape" && setLogoutConfirmOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
          >
            <h2 id="logout-confirm-title" className="mt-5 text-xl font-extrabold">Log out of Gatherly?</h2>
            <p className="mt-2 text-sm leading-6 text-black/50">You’ll need to sign in again to access your organizer workspace.</p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-black/55 transition hover:bg-black/[.03]"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-xl bg-[#756FB8] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#625CA4]"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      )}
      {attendeeCheckInConfirmation && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-[#2D3142]/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && !attendeeCheckInSubmitting && setAttendeeCheckInConfirmation(null)}
          onKeyDown={(event) => event.key === "Escape" && !attendeeCheckInSubmitting && setAttendeeCheckInConfirmation(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendee-check-in-title"
            aria-describedby="attendee-check-in-description"
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-[#E0EADD] text-[#597450]">
              <Icon name="check" />
            </div>
            <h2 id="attendee-check-in-title" className="mt-5 text-xl font-extrabold">Confirm attendee check-in?</h2>
            <p id="attendee-check-in-description" className="mt-2 text-sm leading-6 text-black/50">
              Check in <span className="font-bold text-[#2D3142]">{attendeeCheckInConfirmation.name}</span> for {attendeeCheckInConfirmation.event}?
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAttendeeCheckInConfirmation(null)}
                disabled={attendeeCheckInSubmitting}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-black/60 transition hover:bg-black/[.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAttendeeCheckIn}
                disabled={attendeeCheckInSubmitting}
                className="rounded-xl bg-[#756FB8] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#625CA4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {attendeeCheckInSubmitting ? "Checking in..." : "Confirm check-in"}
              </button>
            </div>
          </section>
        </div>
      )}
      {actionConfirmation && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-[#2D3142]/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && !actionSubmitting && setActionConfirmation(null)}
          onKeyDown={(event) => event.key === "Escape" && !actionSubmitting && setActionConfirmation(null)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="event-action-title"
            aria-describedby="event-action-description"
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl"
          >
            <div className={`grid size-12 place-items-center rounded-2xl ${actionConfirmation.type === "cancel" ? "bg-rose-50 text-rose-600" : actionConfirmation.type === "publish" ? "bg-emerald-50 text-emerald-700" : "bg-[#E7E6F2] text-[#756FB8]"}`}>
              <Icon name={actionConfirmation.type === "cancel" ? "close" : "check"} />
            </div>
            <h2 id="event-action-title" className="mt-5 text-xl font-extrabold">
              {actionConfirmation.type === "cancel"
                ? "Cancel this event?"
                : actionConfirmation.type === "finish"
                  ? "Finish this event?"
                  : actionConfirmation.type === "publish"
                    ? "Publish this event?"
                    : actionConfirmation.type === "create"
                      ? "Create this event?"
                      : "Save event changes?"}
            </h2>
            <p id="event-action-description" className="mt-2 text-sm leading-6 text-black/50">
              {actionConfirmation.type === "cancel"
                ? `Cancel “${actionConfirmation.event.name}”? It will be removed from public registration and moved to the archive. Existing orders and attendee records will be kept.`
                : actionConfirmation.type === "finish"
                  ? `Mark “${actionConfirmation.event.name}” as finished? Its public registration page will no longer be available.`
                  : actionConfirmation.type === "publish"
                    ? `Publish “${actionConfirmation.event.name}”? It will be available publicly for ticket registration.`
                    : actionConfirmation.type === "create"
                      ? `Create “${actionConfirmation.event.name}” and save it as a draft? You can publish it later from your events list.`
                      : `Save your changes to “${actionConfirmation.event.name}”?`}
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionConfirmation(null)}
                disabled={actionSubmitting}
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-black/55 transition hover:bg-black/[.03] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEventAction}
                disabled={actionSubmitting}
                className={`rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${actionConfirmation.type === "cancel" ? "bg-rose-600 hover:bg-rose-700" : actionConfirmation.type === "publish" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#756FB8] hover:bg-[#625CA4]"}`}
              >
                {actionSubmitting
                  ? actionConfirmation.type === "cancel"
                    ? "Cancelling..."
                    : actionConfirmation.type === "finish"
                      ? "Finishing..."
                      : actionConfirmation.type === "publish"
                        ? "Publishing..."
                        : actionConfirmation.type === "create"
                          ? "Creating..."
                          : "Saving..."
                  : actionConfirmation.type === "cancel"
                    ? "Cancel event"
                    : actionConfirmation.type === "finish"
                      ? "Finish event"
                      : actionConfirmation.type === "publish"
                        ? "Publish event"
                        : actionConfirmation.type === "create"
                          ? "Create event"
                          : "Save changes"}
              </button>
            </div>
          </section>
        </div>
      )}
      {eventTabSettingsSection && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-[#2D3142]/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && setEventTabSettingsSection("")}
          onKeyDown={(event) => event.key === "Escape" && setEventTabSettingsSection("")}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-tab-settings-title"
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-[#756FB8]">{eventTabSettingsSection === "analytics" ? "Analytics tabs" : eventTabSettingsSection === "orders" ? "Orders tabs" : "Attendee tabs"}</p>
                <h2 id="event-tab-settings-title" className="mt-2 text-xl font-extrabold">Choose events to show</h2>
                <p className="mt-2 text-sm leading-6 text-black/50">Select which events appear as tabs in {eventTabSettingsSection === "analytics" ? "Analytics" : eventTabSettingsSection === "orders" ? "Orders" : "Attendees"}.</p>
              </div>
              <button
                type="button"
                onClick={() => setEventTabSettingsSection("")}
                aria-label="Close event tab settings"
                className="rounded-xl bg-black/[.04] p-2 text-black/50 transition hover:bg-black/[.08]"
              >
                <Icon name="close" />
              </button>
            </div>
            {eventTabEvents.length > 0
              ? <div className="mt-6 max-h-72 space-y-2 overflow-y-auto">
                {eventTabEvents.map((event) => {
                  const hiddenEventCodes = eventTabSettingsSection === "analytics"
                    ? hiddenAnalyticsEventCodes
                    : eventTabSettingsSection === "orders" ? hiddenOrderEventCodes : hiddenAttendeeEventCodes;
                  const setHiddenEventCodes = eventTabSettingsSection === "analytics"
                    ? setHiddenAnalyticsEventCodes
                    : eventTabSettingsSection === "orders" ? setHiddenOrderEventCodes : setHiddenAttendeeEventCodes;
                  const isVisible = !hiddenEventCodes.includes(event.eventCode);
                  return <label key={event.eventCode} className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/[.06] px-4 py-3 transition hover:bg-[#F8F6F3]">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => setHiddenEventCodes((current) => isVisible
                        ? [...current, event.eventCode]
                        : current.filter((eventCode) => eventCode !== event.eventCode))}
                      className="size-4 accent-[#756FB8]"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{event.name}</span>
                    {event.status === "Finished" && <span className="text-[10px] font-bold uppercase text-black/35">Finished</span>}
                  </label>;
                })}
              </div>
              : <p className="mt-6 rounded-xl bg-[#F8F6F3] p-4 text-sm text-black/45">Publish an event to configure event tabs.</p>}
            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setEventTabSettingsSection("")}
                className="rounded-xl bg-[#756FB8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#625CA4]"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
      {notice && <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-[#2D3142] px-5 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
    </div>
  );
}

function Brand({ light = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${light ? "text-white" : "text-[#2D3142]"}`}>
      <div className={`grid size-9 place-items-center rounded-full ${light ? "bg-white text-[#6670B8]" : "bg-[#2D3142] text-white"}`}>
        <Icon name="ticket" className="size-[18px]" />
      </div>
      <span className="text-lg font-extrabold tracking-[-.04em]">Gatherly</span>
    </div>
  );
}

function Landing({ onEnter, initialError }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCodeVerified, setResetCodeVerified] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState("");
  const [resetPasswordVisibility, setResetPasswordVisibility] = useState({ new: false, confirm: false });
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResendSeconds, setResetResendSeconds] = useState(0);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [registrationName, setRegistrationName] = useState("");
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showResendCountdown, setShowResendCountdown] = useState(false);
  const isEmailVerified = Boolean(email.trim()) && verifiedEmail === email.trim().toLowerCase();

  useEffect(() => {
    if (!verificationOpen || resendSeconds <= 0) return undefined;
    const timeout = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [verificationOpen, resendSeconds]);

  useEffect(() => {
    if (!forgotPassword || !resetCodeSent || resetResendSeconds <= 0) return undefined;
    const timeout = window.setTimeout(() => setResetResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [forgotPassword, resetCodeSent, resetResendSeconds]);

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!registering || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return undefined;
    }

    let activeRequest = true;
    api("/auth/email-verification/status", {
      method: "POST",
      body: JSON.stringify({ email: normalizedEmail }),
    })
      .then(({ verified, registered }) => {
        if (!activeRequest) return;
        setEmailRegistered(registered);
        setVerifiedEmail(verified && !registered ? normalizedEmail : "");
        if (registered) {
          setAuthError("");
          setVerificationMessage("");
        } else {
          setAuthError("");
          if (verified) setVerificationMessage("Email address verified.");
        }
      })
      .catch((error) => {
        if (!activeRequest) return;
        setEmailRegistered(false);
        setVerifiedEmail("");
        setAuthError(error.status === 401 ? "Unable to check email verification. Please try again." : error.message);
      });

    return () => { activeRequest = false; };
  }, [email, registering]);

  async function sendVerificationCode() {
    setVerificationError("");
    setVerificationMessage("");
    setVerificationLoading(true);
    try {
      await api("/auth/email-verification/send", {
        method: "POST",
        body: JSON.stringify({ name: registrationName, email }),
      });
      setCodeExpiresAt(Date.now() + 10 * 60 * 1000);
      setResendSeconds(60);
      setVerificationMessage("A six-digit verification code was sent to your email. It expires in 10 minutes.");
    } catch (error) {
      if (error.retryAfterSeconds) {
        setResendSeconds(error.retryAfterSeconds);
        setVerificationError("");
      } else {
        setVerificationError(error.message);
      }
    } finally {
      setVerificationLoading(false);
    }
  }

  async function openEmailVerification() {
    setAuthError("");
    setVerificationCode("");
    try {
      const { verified, registered } = await api("/auth/email-verification/status", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (registered) {
        setEmailRegistered(true);
        setVerifiedEmail("");
        setAuthError("");
        return;
      }
      if (verified) {
        setVerifiedEmail(email.trim().toLowerCase());
        setEmailRegistered(false);
        setVerificationMessage("Email address is already verified. You can create your account.");
        setVerificationError("");
        return;
      }
    } catch (error) {
      setAuthError(error.status === 401 ? "Unable to check email verification. Please try again." : error.message);
      return;
    }

    setVerificationOpen(true);
    await sendVerificationCode();
  }

  async function verifyEmail(event) {
    event.preventDefault();
    setVerificationError("");
    setVerificationMessage("");
    setVerificationLoading(true);
    try {
      await api("/auth/email-verification/verify", {
        method: "POST",
        body: JSON.stringify({ email, code: verificationCode }),
      });
      setVerifiedEmail(email.trim().toLowerCase());
      setVerificationMessage("Email verified. You can create your account.");
      window.setTimeout(() => setVerificationOpen(false), 900);
    } catch (error) {
      setVerificationError(error.message);
    } finally {
      setVerificationLoading(false);
    }
  }

  async function authenticate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") || "").trim().toLowerCase();
    const submittedPassword = String(form.get("password") || "");
    if (registering && (!submittedEmail || verifiedEmail !== submittedEmail)) {
      setAuthError("Verify your email address before creating your account.");
      return;
    }
    if (registering && getPasswordRequirements(submittedPassword).some(([, met]) => !met)) {
      setAuthError("Meet all password requirements before creating your account.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint = registering ? "/auth/register" : "/auth/login";
      const result = await api(endpoint, {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: submittedEmail,
          password: submittedPassword,
        }),
      });
      onEnter(result.user, registering ? "" : submittedPassword);
      setAuthOpen(false);
    } catch (error) {
      if (error.status === 409 && registering) setEmailRegistered(true);
      setAuthError(error.status === 409 && registering ? "" : error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function requestPasswordReset(event) {
    event?.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    try {
      const result = await api("/auth/password-reset/send", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResetCodeSent(true);
      setResetCodeVerified(false);
      setResetCode("");
      setResetToken("");
      setResetResendSeconds(60);
      setResetMessage(result.message);
    } catch (error) {
      if (error.retryAfterSeconds) setResetResendSeconds(error.retryAfterSeconds);
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  }

  async function verifyPasswordResetCode(event) {
    event.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      const result = await api("/auth/password-reset/verify", {
        method: "POST",
        body: JSON.stringify({ email, code: resetCode }),
      });
      setResetToken(result.resetToken);
      setResetCodeVerified(true);
      setResetCode("");
      setResetMessage("Recovery code verified.");
    } catch (error) {
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  }

  async function completePasswordReset(event) {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    if (resetPassword !== resetPasswordConfirmation) {
      setResetError("The new passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      const result = await api("/auth/password-reset/complete", {
        method: "POST",
        body: JSON.stringify({
          email,
          resetToken,
          newPassword: resetPassword,
          confirmNewPassword: resetPasswordConfirmation,
        }),
      });
      setAuthMessage(result.message);
      setForgotPassword(false);
      setResetCodeSent(false);
      setResetCodeVerified(false);
      setResetCode("");
      setResetToken("");
      setResetPassword("");
      setResetPasswordConfirmation("");
      setPassword("");
    } catch (error) {
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#FAF7F2] text-[#2D3142]">
      <section className="relative overflow-hidden bg-[#6670B8] px-4 pb-20 pt-4 text-white sm:px-6 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -left-20 top-44 size-72 rounded-full border border-white/20" />
          <div className="absolute -right-16 top-24 size-96 rounded-full border border-white/15" />
          <div className="absolute left-[12%] top-52 h-8 w-20 rounded-full bg-white/15 blur-xl" />
        </div>

        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white px-5 py-3 text-[#2D3142] shadow-[0_18px_50px_rgba(22,45,110,.18)] sm:px-7">
          <Brand />
          <nav className="hidden items-center gap-8 text-xs font-bold lg:flex">
            <a href="#features" className="transition hover:text-[#6670B8]">Features</a>
            <a href="#workflow" className="transition hover:text-[#6670B8]">How it works</a>
            <a href="#security" className="transition hover:text-[#6670B8]">Security</a>
            <button onClick={() => { setAuthError(""); setAuthOpen(true); }} className="transition hover:text-[#6670B8]">Sign in</button>
          </nav>
          <button onClick={() => { setAuthError(""); setAuthOpen(true); }} className="hidden rounded-full bg-[#2D3142] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#6670B8] lg:block">Start organizing</button>
          <button onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-full bg-[#F2F0F5] lg:hidden" aria-label="Toggle menu"><Icon name={menuOpen ? "close" : "menu"} /></button>
          {menuOpen && (
            <div className="absolute left-4 right-4 top-[72px] rounded-2xl bg-white p-4 shadow-xl lg:hidden">
              <a href="#features" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#F2F0F5]">Features</a>
              <a href="#workflow" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#F2F0F5]">How it works</a>
              <button onClick={() => { setMenuOpen(false); setAuthError(""); setAuthOpen(true); }} className="mt-2 w-full rounded-xl bg-[#2D3142] px-4 py-3 text-sm font-bold text-white">Sign in</button>
            </div>
          )}
        </header>

        {initialError && <p role="alert" className="relative z-10 mx-auto mt-4 max-w-xl rounded-xl bg-white px-4 py-3 text-center text-xs font-semibold text-rose-700">{initialError}</p>}

        <div className="relative z-10 mx-auto max-w-5xl pt-16 text-center sm:pt-20">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] backdrop-blur">
            <span className="size-2 rounded-full bg-[#F4DFA6]" />Plan together. Celebrate better.
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-.055em] sm:text-5xl lg:text-6xl">Every great event starts with one simple place.</h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Create events, sell tickets, welcome attendees, and understand every result—all from a secure workspace built for modern teams.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => { setRegistering(true); setAuthError(""); setAuthOpen(true); }} className="rounded-full bg-[#F4DFA6] px-7 py-3.5 text-sm font-extrabold text-[#2D3142] shadow-lg transition hover:-translate-y-0.5">Create your first event</button>
            <a href="#features" className="rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">Explore features</a>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-14 max-w-5xl">
          <div className="absolute -left-12 top-20 hidden w-56 rotate-[-5deg] rounded-2xl bg-[#F4DFA6] p-4 text-[#2D3142] shadow-2xl lg:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Check-ins today</p>
            <p className="mt-1 text-3xl font-extrabold">1,204</p>
            <div className="mt-3 flex -space-x-2">
              {[
                ["CS", "Chrysdale Soltes"],
                ["EA", "Emman Agazon"],
                ["NM", "Nicole Macalalad"],
                ["JB", "Jamie Anne Brizal"],
                ["DA", "Diomella Agustin"],
              ].map(([initials, name], i) => <span key={name} title={name} className={`grid size-8 place-items-center rounded-full border-2 border-[#F4DFA6] text-[9px] font-bold ${i % 2 ? "bg-white" : "bg-[#E5B9A8]"}`}>{initials}</span>)}
            </div>
          </div>
          <div className="mx-auto max-w-3xl rounded-[28px] border-[6px] border-[#2D3142] bg-[#F8F6F3] p-3 shadow-[0_35px_80px_rgba(21,38,91,.42)] sm:p-5">
            <div className="flex items-center justify-between rounded-2xl bg-white p-4">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-black/35">Organizer workspace</p><p className="mt-1 text-base font-extrabold text-[#2D3142]">Manila Creatives Summit 2025</p></div>
              <div className="grid size-10 place-items-center rounded-full bg-[#E7E6F2] text-[#6670B8]"><Icon name="bell" className="size-4" /></div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1.45fr_.55fr]">
              <div className="relative min-h-52 overflow-hidden rounded-2xl">
                <img src={eventImage} className="absolute inset-0 size-full object-cover" alt="Crowd enjoying a live event" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D3142]/90 via-transparent" />
                <div className="absolute bottom-0 p-5 text-left"><span className="rounded-full bg-[#F4DFA6] px-2.5 py-1 text-[9px] font-extrabold text-[#2D3142]">ON SALE</span><p className="mt-3 text-xl font-extrabold">342 tickets sold</p><p className="mt-1 text-xs text-white/65">68% of capacity · 5 days left</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                <div className="rounded-2xl bg-[#F2DDD5] p-4 text-left text-[#2D3142]"><Icon name="ticket" className="size-5 text-[#B77765]" /><p className="mt-5 text-2xl font-extrabold">₱2.8M</p><p className="text-[10px] font-semibold text-black/45">Revenue earned</p></div>
                <div className="rounded-2xl bg-[#DFEBEE] p-4 text-left text-[#2D3142]"><Icon name="users" className="size-5 text-[#678FA0]" /><p className="mt-5 text-2xl font-extrabold">1,546</p><p className="text-[10px] font-semibold text-black/45">Happy attendees</p></div>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 bottom-16 hidden w-56 rotate-3 rounded-2xl bg-white p-4 text-[#2D3142] shadow-2xl lg:block">
            <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-[#E8E3F1] text-xs font-bold text-[#756DB4]">NM</div><div><p className="text-xs font-extrabold">Jane Doe</p><p className="text-[9px] text-black/40">New order · #PH1048</p></div></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/5"><div className="h-full w-4/5 rounded-full bg-[#6670B8]" /></div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/[.06] bg-white px-5 py-9">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-extrabold text-black/25">
          <span>MANILA</span><span className="font-serif italic">Cebu</span><span>DAVAO</span><span className="tracking-widest">ILOILO</span><span>BAGUIO</span>
        </div>
      </section>

      <section id="features" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6670B8]">One platform, every detail</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">Smart tools that power every event</h2><p className="mt-4 text-sm leading-6 text-black/50">From the first invitation to the final report, Gatherly keeps your team focused and your guests delighted.</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["bg-[#DFEBDD]", "calendar", "Plan without the chaos", "Build schedules, manage venues, and publish polished event pages from one collaborative workspace."],
              ["bg-[#DFE7F2]", "ticket", "Sell with confidence", "Flexible ticket types, live order tracking, secure checkout, and capacity controls are built right in."],
              ["bg-[#F2DDD5]", "chart", "Learn from every moment", "Turn attendance, revenue, and engagement into clear insights for your next successful event."],
            ].map(([color, icon, title, copy], index) => (
              <article key={title} className={`overflow-hidden rounded-[28px] ${color} p-6`}>
                <div className="relative mb-8 grid h-48 place-items-center overflow-hidden rounded-2xl bg-white/55">
                  <div className={`absolute size-40 rounded-full ${index === 0 ? "bg-[#AACBAE]" : index === 1 ? "bg-[#9FB5D8]" : "bg-[#DFAF9F]"} opacity-50`} />
                  <div className="relative w-36 rounded-2xl bg-white p-4 shadow-xl">
                    <div className="mb-5 flex items-center justify-between"><div className="grid size-8 place-items-center rounded-lg bg-[#2D3142] text-white"><Icon name={icon} className="size-4" /></div><span className="text-[9px] font-bold text-black/30">LIVE</span></div>
                    <div className="space-y-2"><div className="h-2 w-4/5 rounded-full bg-black/10" /><div className="h-2 w-3/5 rounded-full bg-black/10" /><div className="mt-4 h-8 rounded-lg bg-[#2D3142]" /></div>
                  </div>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">{title}</h3><p className="mt-2 text-xs leading-5 text-black/50">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#2D3142] px-5 py-20 text-white sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#BCC9E5]">Built for real teams</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Your entire event operation, in your pocket.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-white/55">React on the web and Flutter on mobile share the same intuitive flow—so organizers can create, update, search, and monitor events anywhere.</p><div id="security" className="mt-8 grid gap-4 sm:grid-cols-2">{[["Protected access", "JWT-ready routes and secure API patterns."], ["Reliable data", "Validated forms and MongoDB-ready models."]].map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm font-extrabold">{title}</p><p className="mt-2 text-xs leading-5 text-white/45">{text}</p></div>)}</div></div>
          <div className="mx-auto w-full max-w-sm rounded-[36px] border-[7px] border-white/10 bg-[#6670B8] p-5 shadow-2xl">
            <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/20" />
            <div className="rounded-3xl bg-[#F8F6F3] p-4 text-[#2D3142]"><div className="flex items-center justify-between"><div><p className="text-[10px] text-black/40">Good morning</p><p className="text-base font-extrabold">Your events</p></div><div className="grid size-9 place-items-center rounded-full bg-[#F4DFA6] text-xs font-bold">CS</div></div><div className="mt-4 rounded-2xl bg-[#2D3142] p-4 text-white"><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Next event</p><p className="mt-2 text-sm font-extrabold">Manila Creatives Summit 2025</p><p className="mt-5 text-2xl font-extrabold">342 <span className="text-xs font-medium text-white/35">tickets</span></p></div><button onClick={() => { setRegistering(false); setAuthError(""); setAuthOpen(true); }} className="mt-4 w-full rounded-xl bg-[#6670B8] py-3 text-xs font-bold text-white">Open dashboard</button></div>
          </div>
        </div>
      </section>

      <footer className="bg-[#2D3142] px-5 pb-10 text-white"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row"><Brand light /><p className="max-w-2xl text-center text-[11px] leading-5 text-white/40 sm:text-right">Made in the Philippines by Chrysdale Soltes, Emman Agazon, Nicole Macalalad, Jamie Anne Brizal, and Diomella Agustin.</p></div></footer>

      {authOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#252938]/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between"><Brand /><button onClick={() => setAuthOpen(false)} className="rounded-full bg-black/5 p-2" aria-label="Close"><Icon name="close" /></button></div>
            <h2 className="mt-8 text-2xl font-extrabold tracking-tight">{forgotPassword ? "Reset your password" : registering ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-2 text-xs leading-5 text-black/45">{forgotPassword ? "We’ll email you a recovery code if an account exists for that address." : registering ? "Start planning your first event in minutes." : "Sign in to continue to your organizer workspace."}</p>
            {authMessage && !forgotPassword && !registering && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{authMessage}</p>}
            {forgotPassword ? <div className="mt-6 space-y-4">
              {!resetCodeSent ? <form onSubmit={requestPasswordReset} className="space-y-4">
                <label className="block"><span className="mb-2 block text-xs font-bold">Email address</span><input required type="email" maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setResetError(""); }} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#6670B8]" placeholder="email@gatherly.ph" /></label>
                {resetError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{resetError}</p>}
                <button disabled={resetLoading} className="w-full rounded-xl bg-[#2D3142] py-3.5 text-sm font-bold text-white transition hover:bg-[#6670B8] disabled:cursor-wait disabled:opacity-60">{resetLoading ? "Sending..." : "Send recovery code"}</button>
              </form> : <>
                <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-5 font-semibold text-emerald-700">{resetMessage}</p>
                {!resetCodeVerified ? <form onSubmit={verifyPasswordResetCode} className="space-y-4">
                  <p className="text-xs text-black/50">Enter the six-digit code sent to <span className="font-bold text-[#2D3142]">{email}</span>.</p>
                  <label className="block"><span className="mb-2 block text-xs font-bold">Recovery code</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={resetCode} onChange={(event) => { setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setResetError(""); }} className="h-12 w-full rounded-xl border border-black/10 px-4 text-center text-lg font-bold tracking-[.35em] outline-none focus:border-[#6670B8]" placeholder="000000" /></label>
                  {resetError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{resetError}</p>}
                  <button disabled={resetLoading || resetCode.length !== 6} className="w-full rounded-xl bg-[#2D3142] py-3.5 text-sm font-bold text-white transition hover:bg-[#6670B8] disabled:cursor-not-allowed disabled:opacity-60">{resetLoading ? "Verifying..." : "Verify recovery code"}</button>
                </form> : <form onSubmit={completePasswordReset} className="space-y-4">
                  <label className="block"><span className="mb-2 block text-xs font-bold">New password</span><span className="relative block"><input required minLength={8} maxLength={128} type={resetPasswordVisibility.new ? "text" : "password"} autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 pr-12 text-sm outline-none focus:border-[#6670B8]" /><button type="button" onClick={() => setResetPasswordVisibility((current) => ({ ...current, new: !current.new }))} aria-label={`${resetPasswordVisibility.new ? "Hide" : "Show"} new password`} aria-pressed={resetPasswordVisibility.new} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-black/45 transition hover:text-[#6670B8]"><Icon name={resetPasswordVisibility.new ? "eyeOff" : "eye"} className="size-[18px]" /></button></span></label>
                  <ul className="space-y-1 text-[11px]" aria-label="Password requirements">
                    {getPasswordRequirements(resetPassword).map(([requirement, met]) => <li key={requirement} className={met ? "font-semibold text-emerald-700" : "text-black/45"}>{met ? "✓" : "○"} {requirement}</li>)}
                  </ul>
                  <label className="block"><span className="mb-2 block text-xs font-bold">Confirm new password</span><span className="relative block"><input required minLength={8} maxLength={128} type={resetPasswordVisibility.confirm ? "text" : "password"} autoComplete="new-password" value={resetPasswordConfirmation} onChange={(event) => setResetPasswordConfirmation(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 pr-12 text-sm outline-none focus:border-[#6670B8]" /><button type="button" onClick={() => setResetPasswordVisibility((current) => ({ ...current, confirm: !current.confirm }))} aria-label={`${resetPasswordVisibility.confirm ? "Hide" : "Show"} confirm new password`} aria-pressed={resetPasswordVisibility.confirm} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-black/45 transition hover:text-[#6670B8]"><Icon name={resetPasswordVisibility.confirm ? "eyeOff" : "eye"} className="size-[18px]" /></button></span>
                    {resetPasswordConfirmation && <span role={resetPassword === resetPasswordConfirmation ? "status" : "alert"} className={`mt-1.5 block text-[11px] font-semibold ${resetPassword === resetPasswordConfirmation ? "text-emerald-700" : "text-rose-600"}`}>{resetPassword === resetPasswordConfirmation ? "Passwords match." : "Passwords do not match."}</span>}
                  </label>
                  {resetError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{resetError}</p>}
                  <button disabled={resetLoading || !resetToken || getPasswordRequirements(resetPassword).some(([, met]) => !met) || resetPassword !== resetPasswordConfirmation} className="w-full rounded-xl bg-[#2D3142] py-3.5 text-sm font-bold text-white transition hover:bg-[#6670B8] disabled:cursor-not-allowed disabled:opacity-60">{resetLoading ? "Updating..." : "Reset password"}</button>
                </form>}
                <div className="flex justify-between gap-3 text-xs font-bold">
                  {!resetCodeVerified && <button type="button" disabled={resetLoading || resetResendSeconds > 0} onClick={() => requestPasswordReset()} className="text-[#6670B8] disabled:cursor-not-allowed disabled:opacity-50">
                    {resetResendSeconds > 0 ? `Resend code in 00:${String(resetResendSeconds).padStart(2, "0")}` : "Resend code"}
                  </button>}
                  <button type="button" disabled={resetLoading} onClick={() => { setResetCodeSent(false); setResetCodeVerified(false); setResetCode(""); setResetToken(""); setResetPassword(""); setResetPasswordConfirmation(""); setResetError(""); setResetMessage(""); setResetResendSeconds(0); }} className="text-black/45 disabled:opacity-50">Use a different email</button>
                </div>
              </>}
              <button type="button" onClick={() => { setForgotPassword(false); setResetError(""); setResetMessage(""); setAuthError(""); }} className="w-full text-center text-xs font-bold text-[#6670B8]">Back to sign in</button>
            </div> : <>
            <form onSubmit={authenticate} className="mt-6 space-y-4">
              {registering && <label className="block"><span className="mb-2 block text-xs font-bold">Full name</span><input name="name" required maxLength={100} value={registrationName} onChange={(event) => setRegistrationName(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#6670B8]" placeholder="Jane Doe" /></label>}
              <div>
                <label htmlFor="auth-email" className="mb-2 block text-xs font-bold">Email address</label>
                <div className="flex gap-2">
                  <input id="auth-email" name="email" required type="email" maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setEmailRegistered(false); setVerifiedEmail(""); setVerificationMessage(""); setAuthError(""); }} className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#6670B8]" placeholder="email@gatherly.ph" />
                  {registering && <button type="button" disabled={!email.trim() || verificationLoading || emailRegistered || isEmailVerified} onClick={openEmailVerification} className="shrink-0 rounded-xl bg-[#E7E6F2] px-4 text-xs font-bold text-[#6670B8] transition hover:bg-[#DCD9EC] disabled:cursor-not-allowed disabled:opacity-60">{isEmailVerified ? "Verified" : "Verify"}</button>}
                </div>
                {registering && emailRegistered && <p role="alert" className="mt-1.5 text-[11px] font-semibold text-rose-700">Email is already registered, please log in to continue.</p>}
                {registering && isEmailVerified && <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">Email address verified.</p>}
              </div>
              <div>
                <label htmlFor="auth-password" className="mb-2 block text-xs font-bold">Password</label>
                <div className="relative">
                  <input id="auth-password" name="password" required minLength={8} maxLength={128} type={passwordVisible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 pr-12 text-sm outline-none focus:border-[#6670B8]" placeholder="Please enter your password" />
                  <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-black/45 transition hover:text-[#6670B8]">
                    <Icon name={passwordVisible ? "eyeOff" : "eye"} className="size-[18px]" />
                  </button>
                </div>
              </div>
              {!registering && <button type="button" onClick={() => { setForgotPassword(true); setAuthError(""); setAuthMessage(""); setResetError(""); setResetMessage(""); setResetCodeSent(false); setResetCode(""); setResetPassword(""); setResetPasswordConfirmation(""); setPassword(""); }} className="block text-xs font-bold text-[#6670B8] transition hover:text-[#2D3142]">Forgot password?</button>}
              {registering && <ul className="space-y-1 text-[11px]" aria-label="Password requirements">
                {getPasswordRequirements(password).map(([requirement, met]) => (
                  <li key={requirement} className={met ? "font-semibold text-emerald-700" : "text-black/45"}>{met ? "✓" : "○"} {requirement}</li>
                ))}
              </ul>}
              {authError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{authError}</p>}
              <button disabled={authLoading || (registering && (!isEmailVerified || emailRegistered))} className="w-full rounded-xl bg-[#2D3142] py-3.5 text-sm font-bold text-white hover:bg-[#6670B8] disabled:cursor-not-allowed disabled:opacity-60">{authLoading ? "Please wait..." : registering ? "Create account" : "Sign in"}</button>
            </form>
            <button onClick={() => { setRegistering((value) => !value); setAuthError(""); setAuthMessage(""); setPassword(""); }} className="mt-5 w-full text-center text-xs font-bold text-[#6670B8]">{registering ? "Already have an account? Sign in" : "New to Gatherly? Create an account"}</button>
            </>}
          </div>
        </div>
      )}
      {verificationOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#252938]/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setVerificationOpen(false)}>
          <div className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#6670B8]">Email verification</p><h2 className="mt-2 text-xl font-extrabold">Check your inbox</h2></div>
              <button type="button" onClick={() => setVerificationOpen(false)} className="rounded-full bg-black/5 p-2" aria-label="Close email verification"><Icon name="close" /></button>
            </div>
            <p className="mt-3 text-xs leading-5 text-black/50">Enter the six-digit code sent to <span className="font-bold text-[#2D3142]">{email}</span>. The code is valid for 10 minutes.</p>
            <form onSubmit={verifyEmail} className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-bold">Verification code</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 w-full rounded-xl border border-black/10 px-4 text-center text-lg font-bold tracking-[.35em] outline-none focus:border-[#6670B8]" placeholder="000000" /></label>
              {verificationMessage && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{verificationMessage}</p>}
              {showResendCountdown && resendSeconds > 0 && <p role="status" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">Please wait {resendSeconds} second{resendSeconds === 1 ? "" : "s"} before requesting another code.</p>}
              {verificationError && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{verificationError}</p>}
              <button disabled={verificationLoading || isEmailVerified} className="w-full rounded-xl bg-[#2D3142] py-3.5 text-sm font-bold text-white hover:bg-[#6670B8] disabled:cursor-wait disabled:opacity-60">{verificationLoading ? "Please wait..." : isEmailVerified ? "Email verified" : "Verify email"}</button>
            </form>
            <button type="button" disabled={verificationLoading || isEmailVerified || resendSeconds > 0} onClick={() => { setShowResendCountdown(true); sendVerificationCode(); }} className="mt-4 w-full text-center text-xs font-bold text-[#6670B8] disabled:opacity-50">Resend code</button>
            {codeExpiresAt && <p className="mt-3 text-center text-[10px] text-black/35">Code expires at {new Date(codeExpiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function RequiredPasswordChange({ user, temporaryPassword, onPasswordChanged, onSignOut }) {
  const [currentPassword, setCurrentPassword] = useState(temporaryPassword);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitPasswordChange(event) {
    event.preventDefault();
    setError("");
    if (!getPasswordRequirements(newPassword).every(([, met]) => met)) {
      setError("Meet all password requirements before continuing.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword: confirmPassword }),
      });
      onPasswordChanged();
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) setCurrentPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EF] px-4 py-10 text-[#2D3142]">
      <section className="w-full max-w-lg rounded-3xl border border-black/[.055] bg-white p-7 shadow-[0_18px_60px_rgba(20,18,26,.08)] sm:p-9">
        <div className="grid size-11 place-items-center rounded-xl bg-[#756FB8] text-lg font-extrabold text-white">G</div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-[#756FB8]">Secure your account</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Change your temporary password</h1>
        <p className="mt-3 text-sm leading-6 text-black/50">Welcome, {user.name}. Choose a new password before continuing to Gatherly.</p>
        <form onSubmit={submitPasswordChange} className="mt-6 space-y-4">
          {!temporaryPassword && <label className="block"><span className="mb-2 block text-xs font-bold">Temporary password</span><span className="relative block"><input required type={passwordVisibility.current ? "text" : "password"} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 pr-12 text-sm outline-none focus:border-[#756FB8]" /><button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, current: !current.current }))} aria-label={`${passwordVisibility.current ? "Hide" : "Show"} temporary password`} aria-pressed={passwordVisibility.current} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-black/45 transition hover:text-[#756FB8]"><Icon name={passwordVisibility.current ? "eyeOff" : "eye"} className="size-[18px]" /></button></span></label>}
          <label className="block"><span className="mb-2 block text-xs font-bold">New password</span><span className="relative block"><input required type={passwordVisibility.new ? "text" : "password"} minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 pr-12 text-sm outline-none focus:border-[#756FB8]" /><button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, new: !current.new }))} aria-label={`${passwordVisibility.new ? "Hide" : "Show"} new password`} aria-pressed={passwordVisibility.new} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-black/45 transition hover:text-[#756FB8]"><Icon name={passwordVisibility.new ? "eyeOff" : "eye"} className="size-[18px]" /></button></span></label>
          <ul className="space-y-1 text-[11px] text-black/50" aria-label="Password requirements">
            {getPasswordRequirements(newPassword).map(([requirement, met]) => <li key={requirement} className={met ? "font-semibold text-emerald-700" : ""}>{met ? "✓" : "•"} {requirement}</li>)}
          </ul>
          <label className="block"><span className="mb-2 block text-xs font-bold">Confirm new password</span><span className="relative block"><input required type={passwordVisibility.confirm ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-xl border border-black/10 px-4 pr-12 text-sm outline-none focus:border-[#756FB8]" /><button type="button" onClick={() => setPasswordVisibility((current) => ({ ...current, confirm: !current.confirm }))} aria-label={`${passwordVisibility.confirm ? "Hide" : "Show"} confirm new password`} aria-pressed={passwordVisibility.confirm} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-black/45 transition hover:text-[#756FB8]"><Icon name={passwordVisibility.confirm ? "eyeOff" : "eye"} className="size-[18px]" /></button></span></label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#756FB8] py-3.5 text-sm font-bold text-white hover:bg-[#625CA4] disabled:opacity-50">{saving ? "Updating password…" : "Change password and continue"}</button>
        </form>
        <button type="button" onClick={onSignOut} className="mt-4 w-full text-center text-xs font-bold text-[#756FB8] hover:text-[#2D3142]">Sign out</button>
      </section>
    </main>
  );
}

export default function App() {
  const publicEventMatch = window.location.pathname.match(/^\/events\/([A-Za-z0-9]{7})\/?$/);
  const publicEventCode = publicEventMatch?.[1];
  const loggedOutStorageKey = "gatherly_logged_out";
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [sessionChecked, setSessionChecked] = useState(
    () => Boolean(publicEventCode) || window.localStorage.getItem(loggedOutStorageKey) === "true",
  );
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (publicEventCode) return undefined;
    if (window.localStorage.getItem(loggedOutStorageKey) === "true") return undefined;

    let activeRequest = true;
    api("/auth/session")
      .then(({ user: sessionUser }) => {
        if (!activeRequest) return;
        if (sessionUser) {
          setUser(sessionUser);
          setScreen("dashboard");
        }
      })
      .catch((error) => {
        if (activeRequest && error.status !== 401) setSessionError(error.message);
      })
      .finally(() => {
        if (activeRequest) setSessionChecked(true);
      });

    return () => { activeRequest = false; };
  }, [publicEventCode]);

  if (!sessionChecked) {
    return <div className="grid min-h-screen place-items-center bg-[#FAF7F2] text-sm font-semibold text-[#2D3142]" role="status">Loading Gatherly...</div>;
  }

  async function signOut() {
    window.localStorage.setItem(loggedOutStorageKey, "true");
    setUser(null);
    setTemporaryPassword("");
    setSessionError("");
    setScreen("landing");
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      setSessionError("You are signed out on this device, but Gatherly could not reach the server to invalidate your session. Sign out again once the backend is available.");
    }
  }

  function enterDashboard(sessionUser, submittedPassword = "") {
    window.localStorage.removeItem(loggedOutStorageKey);
    setUser(sessionUser);
    setTemporaryPassword(sessionUser.mustChangePassword ? submittedPassword : "");
    setSessionError("");
    setScreen("dashboard");
  }

  if (publicEventCode) {
    return <PublicEventPage eventCode={publicEventCode} />;
  }

  if (user?.mustChangePassword) {
    return <RequiredPasswordChange
      user={user}
      temporaryPassword={temporaryPassword}
      onPasswordChanged={() => {
        setUser((current) => ({ ...current, mustChangePassword: false }));
        setTemporaryPassword("");
      }}
      onSignOut={signOut}
    />;
  }

  return screen === "landing"
    ? <Landing onEnter={enterDashboard} initialError={sessionError} />
    : user.accountType === "admin"
      ? <AdminDashboard user={user} onSignOut={signOut} />
      : <Dashboard user={user} onSignOut={signOut} onUserUpdate={setUser} />;
}
