import { useMemo, useState } from "react";

function Icon({ name, className = "size-5" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><path d="M7 2v3M17 2v3M3.5 9h17" /><rect x="3.5" y="4" width="17" height="17" rx="2.5" /></>,
    ticket: <><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" /><path d="M13 7.5v2M13 14.5v2" /></>,
    users: <><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8M22 20v-2a4 4 0 0 0-3-3.87" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.38a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.62 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.62a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 3.2 2.4c-.9.35-.9 1.1-.9 1.6M12 17h.01" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
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

const initialEvents = [
  { id: 1, name: "Manila Creatives Summit 2025", date: "18 Oct 2025", time: "9:00 AM", venue: "SMX Convention Center, Pasay", sold: 342, total: 500, status: "On sale" },
  { id: 2, name: "Makati Founders Night", date: "24 Oct 2025", time: "7:30 PM", venue: "The Astbury, Makati", sold: 186, total: 250, status: "On sale" },
  { id: 3, name: "Philippine Product Summit", date: "6 Nov 2025", time: "10:00 AM", venue: "Online event · Philippines", sold: 920, total: 1200, status: "Draft" },
  { id: 4, name: "Cebu Creatives Morning", date: "15 Nov 2025", time: "8:30 AM", venue: "Ayala Center Cebu", sold: 98, total: 150, status: "On sale" },
];

const nav = [
  ["Overview", "grid"],
  ["Events", "calendar"],
  ["Orders", "ticket"],
  ["Attendees", "users"],
  ["Analytics", "chart"],
];

function Dashboard({ onHome }) {
  const [active, setActive] = useState("Overview");
  const [events, setEvents] = useState(initialEvents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All events");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [analyticsRange, setAnalyticsRange] = useState("30 days");
  const [orders, setOrders] = useState([
    { id: "PH1048", buyer: "Nicole Macalalad", event: "Manila Creatives Summit 2025", amount: "₱2,500", status: "Paid" },
    { id: "PH1047", buyer: "Emman Agazon", event: "Makati Founders Night", amount: "₱1,800", status: "Paid" },
    { id: "PH1046", buyer: "Jamie Anne Brizal", event: "Cebu Creatives Morning", amount: "₱950", status: "Paid" },
  ]);
  const [attendees, setAttendees] = useState([
    { id: 1, name: "Emman Agazon", event: "Manila Creatives Summit 2025", ticket: "VIP Pass", checkedIn: true },
    { id: 2, name: "Nicole Macalalad", event: "Manila Creatives Summit 2025", ticket: "Regular", checkedIn: false },
    { id: 3, name: "Jamie Anne Brizal", event: "Makati Founders Night", ticket: "Early Bird", checkedIn: false },
    { id: 4, name: "Diomella Agustin", event: "Cebu Creatives Morning", ticket: "Regular", checkedIn: true },
  ]);

  const filtered = useMemo(() => events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase()) || event.venue.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All events" || event.status === filter;
    return matchesSearch && matchesFilter;
  }), [events, search, filter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 3));
  const pagedEvents = filtered.slice((page - 1) * 3, page * 3);
  const selectedEvent = events.find((event) => event.id === editingEvent);

  function saveEvent(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name")),
      date: String(form.get("date")) || selectedEvent?.date || "12 Dec 2025",
      time: String(form.get("time")) || selectedEvent?.time || "6:00 PM",
      venue: String(form.get("venue")) || "Philippine venue to be announced",
      total: Number(form.get("capacity")) || 100,
    };
    if (editingEvent) {
      setEvents((current) => current.map((item) => item.id === editingEvent ? { ...item, ...values } : item));
      setNotice("Event details updated.");
    } else {
      setEvents((current) => [{ id: Date.now(), ...values, sold: 0, status: "Draft" }, ...current]);
      setNotice("Event created and saved as a draft.");
    }
    setModalOpen(false);
    setEditingEvent(null);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function removeEvent(id) {
    if (!window.confirm("Delete this event? This action cannot be undone.")) return;
    setEvents((current) => current.filter((event) => event.id !== id));
    setPage(1);
    setNotice("Event deleted.");
    window.setTimeout(() => setNotice(""), 3200);
  }

  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#2D3142] text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between px-7">
        <button className="flex items-center gap-3" onClick={onHome} aria-label="Back to Gatherly home">
          <div className="grid size-9 place-items-center rounded-xl bg-[#756FB8] shadow-[0_8px_24px_rgba(114,87,245,.35)]">
            <div className="size-3 rotate-45 rounded-[3px] border-2 border-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Gatherly</span>
        </button>
        <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><Icon name="close" /></button>
      </div>
      <div className="px-4 pt-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Workspace</p>
        <nav className="space-y-1">
          {nav.map(([label, icon]) => (
            <button key={label} onClick={() => { setActive(label); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${active === label ? "bg-white text-[#2D3142]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
              <Icon name={icon} className="size-[19px]" />{label}
              {label === "Orders" && <span className="ml-auto rounded-full bg-[#756FB8] px-2 py-0.5 text-[10px] text-white">12</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="mb-4 rounded-2xl bg-white/[.06] p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-[#F4DFA6] text-[#2D3142]"><Icon name="help" className="size-5" /></div>
          <p className="text-sm font-bold">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-white/45">Our event experts are here to help.</p>
          <button className="mt-3 text-xs font-bold text-[#C4BEE5] hover:text-white">Visit help center →</button>
        </div>
        <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-white/55 hover:bg-white/5 hover:text-white"><Icon name="settings" className="size-[19px]" />Settings</button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#2D3142]">
      <Sidebar />
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
            <button className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white">
              <div className="grid size-9 place-items-center rounded-xl bg-[#E6E2F2] text-xs font-extrabold text-[#7067AD]">CS</div>
              <div className="hidden text-left sm:block"><p className="text-sm font-bold">Chrysdale Soltes</p><p className="text-[11px] text-black/40">Event organizer</p></div>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-[#756FB8]">{active === "Overview" ? "Monday, 13 October 2025" : "Organizer workspace"}</p>
              <h1 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{active === "Overview" ? "Magandang umaga, Chrysdale." : active}</h1>
              <p className="mt-2 text-sm text-black/45">{active === "Overview" ? "Here’s what’s happening across your events." : `Manage your ${active.toLowerCase()} in one place.`}</p>
            </div>
            {(active === "Overview" || active === "Events") && <button onClick={() => { setEditingEvent(null); setModalOpen(true); }} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#756FB8] px-5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(114,87,245,.25)] transition hover:-translate-y-0.5 hover:bg-[#625CA4]">
              <Icon name="plus" className="size-4" />Create event
            </button>}
          </div>

          {active === "Overview" && <><section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total revenue", "₱2,795,450", "+12.4%", "chart", "bg-[#E9E5F3] text-[#756FB8]"],
              ["Tickets sold", "1,546", "+8.2%", "ticket", "bg-[#E2ECF4] text-[#6689A3]"],
              ["Total attendees", "1,204", "+16.8%", "users", "bg-[#E0EADD] text-[#708965]"],
              ["Active events", "4", "2 drafts", "calendar", "bg-[#F4E7D3] text-[#A17850]"],
            ].map(([label, value, change, icon, color]) => (
              <article key={label} className="rounded-2xl border border-black/[.055] bg-white p-5 shadow-[0_2px_10px_rgba(20,18,26,.025)]">
                <div className="flex items-center justify-between"><div className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon name={icon} className="size-[19px]" /></div><Icon name="more" className="size-5 text-black/25" /></div>
                <p className="mt-6 text-xs font-semibold text-black/40">{label}</p>
                <div className="mt-1.5 flex items-end justify-between gap-2"><p className="text-2xl font-extrabold tracking-tight">{value}</p><span className={`mb-1 text-[11px] font-bold ${change.toString().startsWith("+") ? "text-emerald-600" : "text-black/35"}`}>{change}</span></div>
              </article>
            ))}
          </section>

          <section className="mb-6 overflow-hidden rounded-2xl bg-[#333746] text-white">
            <div className="grid md:grid-cols-[1.1fr_.9fr]">
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <div className="mb-5 flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-[#F4DFA6]" /><span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">Next up · 5 days</span></div>
                <h2 className="max-w-lg text-2xl font-extrabold tracking-[-.03em] sm:text-3xl">Manila Creatives Summit 2025</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/50">A full-day gathering for the people shaping what design becomes next.</p>
                <div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-2"><Icon name="calendar" className="size-4 text-[#C4BEE5]" />18 Oct 2025</span>
                  <span className="flex items-center gap-2"><Icon name="location" className="size-4 text-[#C4BEE5]" />SMX Convention Center, Pasay</span>
                </div>
                <div className="mt-7 flex items-center gap-4">
                  <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black transition hover:bg-[#F4DFA6]">Manage event <Icon name="arrow" className="size-3.5" /></button>
                  <div><p className="text-sm font-extrabold">342 <span className="font-medium text-white/35">/ 500</span></p><p className="text-[10px] text-white/35">tickets sold</p></div>
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
            <div className="border-b border-black/[.06] p-6"><h2 className="text-lg font-extrabold">Recent orders</h2><p className="mt-1 text-xs text-black/40">Review payments and process refunds.</p></div>
            <div className="divide-y divide-black/[.05]">
              {orders.map((order) => <div key={order.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7E6F2] text-[#756FB8]"><Icon name="ticket" className="size-5" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{order.buyer}</p><p className="mt-1 truncate text-[11px] text-black/40">{order.id} · {order.event}</p></div>
                <p className="text-sm font-extrabold">{order.amount}</p>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${order.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-[#F2DDD5] text-[#9b5f50]"}`}>{order.status}</span>
                <button disabled={order.status === "Refunded"} onClick={() => { setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: "Refunded" } : item)); setNotice(`${order.id} refunded successfully.`); window.setTimeout(() => setNotice(""), 3200); }} className="rounded-xl border border-black/10 px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-35">Refund</button>
              </div>)}
            </div>
          </section>}

          {active === "Attendees" && <section className="overflow-hidden rounded-2xl border border-black/[.055] bg-white">
            <div className="border-b border-black/[.06] p-6"><h2 className="text-lg font-extrabold">Attendee check-in</h2><p className="mt-1 text-xs text-black/40">{attendees.filter((person) => person.checkedIn).length} of {attendees.length} guests checked in.</p></div>
            <div className="divide-y divide-black/[.05]">
              {attendees.map((person) => <div key={person.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#DFE7F2] text-xs font-extrabold text-[#6689A3]">{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{person.name}</p><p className="mt-1 truncate text-[11px] text-black/40">{person.ticket} · {person.event}</p></div>
                <button onClick={() => setAttendees((current) => current.map((item) => item.id === person.id ? { ...item, checkedIn: !item.checkedIn } : item))} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${person.checkedIn ? "bg-[#E0EADD] text-[#597450]" : "bg-[#756FB8] text-white"}`}>{person.checkedIn ? "Checked in" : "Check in"}</button>
              </div>)}
            </div>
          </section>}

          {active === "Analytics" && <section className="rounded-2xl border border-black/[.055] bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-extrabold">Ticket performance</h2><p className="mt-1 text-xs text-black/40">Sales performance across Philippine events.</p></div><select value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-xs font-bold"><option>7 days</option><option>30 days</option><option>12 months</option></select></div>
            <div className="mt-8 space-y-6">
              {events.map((event) => { const percent = Math.round((event.sold / event.total) * 100); return <div key={event.id}><div className="mb-2 flex items-center justify-between gap-4"><p className="truncate text-xs font-bold">{event.name}</p><p className="shrink-0 text-xs font-extrabold text-[#756FB8]">{percent}%</p></div><div className="h-3 overflow-hidden rounded-full bg-black/[.05]"><div className="h-full rounded-full bg-[#756FB8] transition-all" style={{ width: `${percent}%` }} /></div></div>; })}
            </div>
            <div className="mt-8 rounded-2xl bg-[#F8F6F3] p-5 text-xs leading-5 text-black/55">Showing the last {analyticsRange}. Manila Creatives Summit currently has the strongest ticket velocity.</div>
          </section>}

          {(active === "Overview" || active === "Events") && <section className="rounded-2xl border border-black/[.055] bg-white shadow-[0_2px_10px_rgba(20,18,26,.025)]">
            <div className="flex flex-col gap-4 border-b border-black/[.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><h2 className="text-lg font-extrabold tracking-tight">Your events</h2><p className="mt-1 text-xs text-black/40">Manage your upcoming schedule</p></div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:hidden"><Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-black/10 pl-9 pr-3 text-xs outline-none" placeholder="Search" /></div>
                <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-black/[.08] bg-white px-3 text-xs font-semibold outline-none"><option>All events</option><option>On sale</option><option>Draft</option></select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead><tr className="border-b border-black/[.05] text-[10px] font-bold uppercase tracking-[.12em] text-black/35"><th className="px-6 py-4">Event</th><th className="px-4 py-4">Date & time</th><th className="px-4 py-4">Tickets sold</th><th className="px-4 py-4">Status</th><th className="px-6 py-4" /></tr></thead>
                <tbody>
                  {pagedEvents.map((event) => (
                    <tr key={event.id} className="group border-b border-black/[.045] last:border-0 hover:bg-[#F9F7F5]">
                      <td className="px-6 py-4"><p className="text-sm font-bold">{event.name}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-black/40"><Icon name="location" className="size-3" />{event.venue}</p></td>
                      <td className="px-4 py-4"><p className="text-xs font-semibold">{event.date}</p><p className="mt-1 text-[11px] text-black/40">{event.time}</p></td>
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#756FB8]" style={{ width: `${Math.min((event.sold / event.total) * 100, 100)}%` }} /></div><span className="text-[11px] font-semibold text-black/50">{event.sold}/{event.total}</span></div></td>
                      <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${event.status === "On sale" ? "bg-emerald-50 text-emerald-700" : "bg-black/[.05] text-black/45"}`}><span className={`size-1.5 rounded-full ${event.status === "On sale" ? "bg-emerald-500" : "bg-black/30"}`} />{event.status}</span></td>
                      <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => { setEditingEvent(event.id); setModalOpen(true); }} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-[#756FB8] hover:bg-[#E7E6F2]">Edit</button><button onClick={() => removeEvent(event.id)} className="rounded-lg px-2.5 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-14 text-center"><p className="font-bold">No events found</p><p className="mt-1 text-xs text-black/40">Try another search or filter.</p></div>}
            </div>
            <div className="flex items-center justify-between border-t border-black/[.05] px-6 py-4"><p className="text-[11px] text-black/40">Showing {filtered.length ? (page - 1) * 3 + 1 : 0}–{Math.min(page * 3, filtered.length)} of {filtered.length} events</p><div className="flex gap-1"><button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid size-8 place-items-center rounded-lg border border-black/[.07] text-black/50 disabled:opacity-25"><Icon name="arrow" className="size-3 rotate-180" /></button><button className="grid size-8 place-items-center rounded-lg bg-[#756FB8] text-[11px] font-bold text-white">{page}</button><button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="grid size-8 place-items-center rounded-lg border border-black/[.07] text-black/50 disabled:opacity-25"><Icon name="arrow" className="size-3" /></button></div></div>
          </section>}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2D3142]/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-7 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#756FB8]">{editingEvent ? "Edit event" : "New event"}</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight">{editingEvent ? "Update event details" : "Create something memorable"}</h2></div><button className="rounded-xl bg-black/[.04] p-2 text-black/50 hover:bg-black/[.08]" onClick={() => { setModalOpen(false); setEditingEvent(null); }} aria-label="Close"><Icon name="close" /></button></div>
            <form onSubmit={saveEvent} className="space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-bold">Event name</span><input name="name" required autoFocus defaultValue={selectedEvent?.name} placeholder="e.g. Philippine Tech Expo" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8] focus:ring-4 focus:ring-[#756FB8]/10" /></label>
              <div className="grid grid-cols-2 gap-4"><label><span className="mb-2 block text-xs font-bold">Date</span><input name="date" type="date" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label><label><span className="mb-2 block text-xs font-bold">Time</span><input name="time" type="time" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label></div>
              <label className="block"><span className="mb-2 block text-xs font-bold">Venue</span><input name="venue" defaultValue={selectedEvent?.venue} placeholder="Add a Philippine venue or online link" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
              <label className="block"><span className="mb-2 block text-xs font-bold">Capacity</span><input name="capacity" type="number" min="1" defaultValue={selectedEvent?.total} placeholder="100" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#756FB8]" /></label>
              <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => { setModalOpen(false); setEditingEvent(null); }} className="rounded-xl px-5 py-3 text-sm font-bold text-black/50 hover:bg-black/[.04]">Cancel</button><button type="submit" className="rounded-xl bg-[#756FB8] px-5 py-3 text-sm font-bold text-white hover:bg-[#625CA4]">{editingEvent ? "Save changes" : "Create draft"}</button></div>
            </form>
          </div>
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

function Landing({ onEnter }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  function authenticate(event) {
    event.preventDefault();
    setAuthOpen(false);
    onEnter();
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#FAF7F2] text-[#2D3142]">
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
            <button onClick={() => setAuthOpen(true)} className="transition hover:text-[#6670B8]">Sign in</button>
          </nav>
          <button onClick={() => setAuthOpen(true)} className="hidden rounded-full bg-[#2D3142] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#6670B8] lg:block">Start organizing</button>
          <button onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-full bg-[#F2F0F5] lg:hidden" aria-label="Toggle menu"><Icon name={menuOpen ? "close" : "menu"} /></button>
          {menuOpen && (
            <div className="absolute left-4 right-4 top-[72px] rounded-2xl bg-white p-4 shadow-xl lg:hidden">
              <a href="#features" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#F2F0F5]">Features</a>
              <a href="#workflow" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#F2F0F5]">How it works</a>
              <button onClick={() => { setMenuOpen(false); setAuthOpen(true); }} className="mt-2 w-full rounded-xl bg-[#2D3142] px-4 py-3 text-sm font-bold text-white">Sign in</button>
            </div>
          )}
        </header>

        <div className="relative z-10 mx-auto max-w-5xl pt-16 text-center sm:pt-20">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] backdrop-blur">
            <span className="size-2 rounded-full bg-[#F4DFA6]" />Plan together. Celebrate better.
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-.055em] sm:text-5xl lg:text-6xl">Every great event starts with one simple place.</h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Create events, sell tickets, welcome attendees, and understand every result—all from a secure workspace built for modern teams.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => { setRegistering(true); setAuthOpen(true); }} className="rounded-full bg-[#F4DFA6] px-7 py-3.5 text-sm font-extrabold text-[#2D3142] shadow-lg transition hover:-translate-y-0.5">Create your first event</button>
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
            <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-[#E8E3F1] text-xs font-bold text-[#756DB4]">NM</div><div><p className="text-xs font-extrabold">Nicole Macalalad</p><p className="text-[9px] text-black/40">New order · #PH1048</p></div></div>
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
            <div className="rounded-3xl bg-[#F8F6F3] p-4 text-[#2D3142]"><div className="flex items-center justify-between"><div><p className="text-[10px] text-black/40">Good morning</p><p className="text-base font-extrabold">Your events</p></div><div className="grid size-9 place-items-center rounded-full bg-[#F4DFA6] text-xs font-bold">CS</div></div><div className="mt-4 rounded-2xl bg-[#2D3142] p-4 text-white"><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Next event</p><p className="mt-2 text-sm font-extrabold">Manila Creatives Summit 2025</p><p className="mt-5 text-2xl font-extrabold">342 <span className="text-xs font-medium text-white/35">tickets</span></p></div><button onClick={onEnter} className="mt-4 w-full rounded-xl bg-[#6670B8] py-3 text-xs font-bold text-white">Open dashboard</button></div>
          </div>
        </div>
      </section>

      <footer className="bg-[#2D3142] px-5 pb-10 text-white"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row"><Brand light /><p className="max-w-2xl text-center text-[11px] leading-5 text-white/40 sm:text-right">Made in the Philippines by Chrysdale Soltes, Emman Agazon, Nicole Macalalad, Jamie Anne Brizal, and Diomella Agustin.</p></div></footer>

      {authOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#252938]/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between"><Brand /><button onClick={() => setAuthOpen(false)} className="rounded-full bg-black/5 p-2" aria-label="Close"><Icon name="close" /></button></div>
            <h2 className="mt-8 text-2xl font-extrabold tracking-tight">{registering ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-2 text-xs leading-5 text-black/45">{registering ? "Start planning your first event in minutes." : "Sign in to continue to your organizer workspace."}</p>
            <form onSubmit={authenticate} className="mt-6 space-y-4">
              {registering && <label className="block"><span className="mb-2 block text-xs font-bold">Full name</span><input required className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#6670B8]" placeholder="Chrysdale Soltes" /></label>}
              <label className="block"><span className="mb-2 block text-xs font-bold">Email address</span><input required type="email" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#6670B8]" placeholder="chrysdale@gatherly.ph" /></label>
              <label className="block"><span className="mb-2 block text-xs font-bold">Password</span><input required minLength={6} type="password" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-[#6670B8]" placeholder="At least 6 characters" /></label>
              <button className="w-full rounded-xl bg-[#2D3142] py-3.5 text-sm font-bold text-white hover:bg-[#6670B8]">{registering ? "Create account" : "Sign in securely"}</button>
            </form>
            <button onClick={() => setRegistering((value) => !value)} className="mt-5 w-full text-center text-xs font-bold text-[#6670B8]">{registering ? "Already have an account? Sign in" : "New to Gatherly? Create an account"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  return screen === "landing" ? <Landing onEnter={() => setScreen("dashboard")} /> : <Dashboard onHome={() => setScreen("landing")} />;
}
