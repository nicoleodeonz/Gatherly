import { useEffect, useState } from "react";
import { api } from "./api.js";

const gatherlyProcessingFeeCents = 2500;

function formatPrice(priceCents) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(priceCents / 100);
}

export default function PublicEventPage({ eventCode }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [discoverySource, setDiscoverySource] = useState("");
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [confirmationEmailStatus, setConfirmationEmailStatus] = useState("");
  const remainingTickets = event ? event.available : 0;

  useEffect(() => {
    let active = true;
    api(`/public/events/${encodeURIComponent(eventCode)}`)
      .then((loadedEvent) => {
        if (active) setEvent(loadedEvent);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [eventCode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const orderToken = params.get("order");
    if (!orderToken || !["success", "cancelled"].includes(payment)) return undefined;
    let active = true;

    if (payment === "cancelled") {
      api(`/public/orders/${encodeURIComponent(orderToken)}/cancel`, { method: "POST" })
        .then(async ({ cancelled }) => {
          if (!active) return;
          if (cancelled) {
            setPaymentStatus("cancelled");
            return;
          }
          const order = await api(`/public/orders/${encodeURIComponent(orderToken)}/status`);
          if (active) {
            setPaymentStatus(order.status);
            setConfirmationEmailStatus(order.emailStatus);
          }
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        });
      return () => { active = false; };
    }

    let attempts = 0;
    const checkStatus = async () => {
      try {
        const order = await api(`/public/orders/${encodeURIComponent(orderToken)}/status`);
        if (!active) return;
        setPaymentStatus(order.status);
        setConfirmationEmailStatus(order.emailStatus);
        if (order.status !== "Pending") return;
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      }
      attempts += 1;
      if (active && attempts < 20) window.setTimeout(checkStatus, 2000);
      else if (active) setPaymentStatus("verification pending");
    };
    checkStatus();
    return () => { active = false; };
  }, []);

  async function register(eventForm) {
    eventForm.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await api(`/public/events/${encodeURIComponent(eventCode)}/register`, {
        method: "POST",
        body: JSON.stringify({ name, email, discoverySource, ticketTypeId: activeTicketId }),
      });
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setConfirmationEmailStatus(result.emailStatus || "");
      setMessage(result.emailStatus === "Sent"
        ? "Registration confirmed. A confirmation email has been sent."
        : "Registration confirmed. Your confirmation email is pending delivery; please check your spam folder if it does not arrive soon.");
      setName("");
      setEmail("");
      setDiscoverySource("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const tickets = event?.pricingMode === "multiple"
    ? event.ticketTypes
    : event?.pricingMode === "single"
      ? [{ id: "general", name: "General admission", priceCents: event.priceCents }]
      : [{ id: "free", name: "Free registration", priceCents: 0 }];
  const activeTicketId = ticketTypeId || tickets?.[0]?.id || "";
  const selectedTicket = tickets?.find((ticket) => ticket.id === activeTicketId);
  const processingFeeCents = selectedTicket?.priceCents > 0 ? gatherlyProcessingFeeCents : 0;

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#FAF7F2] text-sm font-semibold text-[#2D3142]">Loading event...</main>;
  }

  if (!event) {
    return <main className="grid min-h-screen place-items-center bg-[#FAF7F2] p-6 text-center"><div><h1 className="text-2xl font-extrabold">Event unavailable</h1><p className="mt-2 text-sm text-black/50">{error || "This event link may be invalid or unpublished."}</p><a href="/" className="mt-6 inline-block rounded-xl bg-[#756FB8] px-5 py-3 text-sm font-bold text-white">Visit Gatherly</a></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-8 text-[#2D3142] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold"><span className="grid size-8 place-items-center rounded-xl bg-[#756FB8] text-white">G</span>Gatherly</a>
        {paymentStatus && <section aria-live="polite" className={`mb-6 rounded-2xl p-5 text-sm font-semibold ${paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-800" : paymentStatus === "cancelled" || paymentStatus === "Cancelled" ? "bg-amber-50 text-amber-900" : "bg-[#E7E6F2] text-[#514B86]"}`}>
          {paymentStatus === "Paid" ? `Payment confirmed. Your registration is complete.${confirmationEmailStatus === "Sent" ? " A confirmation email has been sent." : confirmationEmailStatus === "Pending" || confirmationEmailStatus === "Sending" ? " Your confirmation email is being sent." : ""}` : paymentStatus === "cancelled" || paymentStatus === "Cancelled" ? "Checkout was cancelled. Your ticket reservation has been released." : paymentStatus === "Pending" || paymentStatus === "verification pending" ? "Payment is being confirmed by PayMongo. This page will update when confirmation arrives." : `Registration status: ${paymentStatus}.`}
        </section>}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#756FB8]">{event.category}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{event.name}</h1>
            <p className="mt-3 text-sm font-semibold text-black/50">{event.headliner}</p>
            <div className="mt-8 grid gap-4 border-y border-black/[.07] py-6 sm:grid-cols-2">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Date and time</p><p className="mt-2 text-sm font-semibold">{event.date}{event.multipleDay && event.endDate ? ` – ${event.endDate}` : ""} · {event.time}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Venue</p><p className="mt-2 text-sm font-semibold">{event.venue}</p></div>
            </div>
            <h2 className="mt-8 text-lg font-extrabold">About this event</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/60">{event.description}</p>
          </article>
          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#756FB8]">Get your tickets</p>
            <p className="mt-2 text-sm text-black/45">{remainingTickets} ticket{remainingTickets === 1 ? "" : "s"} remaining</p>
            <form onSubmit={register} className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-bold">Ticket type <span className="text-rose-600">*</span></span><select required value={activeTicketId} onChange={(input) => setTicketTypeId(input.target.value)} className="h-12 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#756FB8]">{tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.name} · {formatPrice(ticket.priceCents)}</option>)}</select></label>
              <p className="rounded-xl bg-[#F8F6F3] px-3 py-2 text-xs text-black/55">Registration is limited to one ticket per person.</p>
              <label className="block"><span className="mb-2 block text-xs font-bold">Full name <span className="text-rose-600">*</span></span><input value={name} onChange={(input) => setName(input.target.value)} required maxLength={120} autoComplete="name" className="h-12 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#756FB8]" /></label>
              <label className="block"><span className="mb-2 block text-xs font-bold">Email <span className="text-rose-600">*</span></span><input type="email" value={email} onChange={(input) => setEmail(input.target.value)} required maxLength={254} autoComplete="email" className="h-12 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#756FB8]" /></label>
              <label className="block"><span className="mb-2 block text-xs font-bold">Where did you hear about this event? <span className="text-rose-600">*</span></span><input value={discoverySource} onChange={(input) => setDiscoverySource(input.target.value)} required maxLength={200} autoComplete="off" placeholder="e.g. Social media, a friend, or an ad" className="h-12 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:border-[#756FB8]" /></label>
              {selectedTicket && <div className="space-y-2 border-t border-black/[.07] pt-4 text-sm">
                <div className="flex justify-between"><span className="text-black/50">Ticket price</span><span>{formatPrice(selectedTicket.priceCents)}</span></div>
                {processingFeeCents > 0 && <div className="flex justify-between"><span className="text-black/50">Gatherly processing fee</span><span>{formatPrice(processingFeeCents)}</span></div>}
                <div className="flex justify-between border-t border-black/[.07] pt-2"><span className="text-black/50">Total</span><strong>{formatPrice(selectedTicket.priceCents + processingFeeCents)}</strong></div>
              </div>}
              {error && <p role="alert" className="text-xs leading-5 text-rose-600">{error}</p>}
              {message && <p role="status" className="text-xs leading-5 text-emerald-700">{message}</p>}
              <button type="submit" disabled={submitting || remainingTickets === 0} className="w-full rounded-xl bg-[#756FB8] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#625CA4] disabled:cursor-not-allowed disabled:opacity-50">{remainingTickets === 0 ? "Sold out" : submitting ? "Processing..." : selectedTicket?.priceCents ? "Continue to secure payment" : "Complete free registration"}</button>
              {selectedTicket?.priceCents > 0 && <p className="text-center text-[11px] leading-5 text-black/40">Secure payment is processed by PayMongo. Your registration is confirmed after payment.</p>}
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
