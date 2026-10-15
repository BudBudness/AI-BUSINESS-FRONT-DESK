"use client";

import { useEffect, useMemo, useState } from "react";
import { BedDouble, CalendarDays, CheckCircle2, CircleAlert, Clock3, Plus, Search, Users, X } from "lucide-react";

type Booking = {
  id: string;
  guest: string;
  phone: string;
  room: number;
  checkIn: string;
  checkOut: string;
  status: "Enquiry" | "Reserved" | "Checked in" | "Checked out" | "Cancelled";
  paid: number;
  notes: string;
};

const STORAGE_KEY = "image-coffee-accommodation-bookings-v1";
const RATE = 100000;
const rooms = Array.from({ length: 13 }, (_, i) => i + 1);

function nightsBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const n = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return Math.max(0, n);
}

function money(n: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);
}

export default function Home() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ guest: "", phone: "", room: "1", checkIn: "", checkOut: "", status: "Reserved" as Booking["status"], paid: "0", notes: "" });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setBookings(JSON.parse(raw) as Booking[]);
    } catch { /* Ignore invalid local demo data. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings, ready]);

  const today = new Date().toISOString().slice(0, 10);
  const active = bookings.filter(b => !["Cancelled", "Checked out"].includes(b.status));
  const arrivals = active.filter(b => b.checkIn === today);
  const expectedRevenue = bookings.filter(b => ["Reserved", "Checked in", "Checked out"].includes(b.status)).reduce((sum, b) => sum + nightsBetween(b.checkIn, b.checkOut) * RATE, 0);
  const outstanding = bookings.filter(b => !["Cancelled"].includes(b.status)).reduce((sum, b) => sum + Math.max(0, nightsBetween(b.checkIn, b.checkOut) * RATE - b.paid), 0);
  const filtered = useMemo(() => bookings.filter(b => [b.guest, b.phone, String(b.room), b.status].some(v => v.toLowerCase().includes(query.toLowerCase()))).sort((a,b) => a.checkIn.localeCompare(b.checkIn)), [bookings, query]);

  function overlaps(room: number, start: string, end: string, exceptId?: string) {
    return bookings.some(b => b.id !== exceptId && b.room === room && !["Cancelled", "Checked out"].includes(b.status) && start < b.checkOut && end > b.checkIn);
  }

  function addBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const room = Number(form.room);
    const nights = nightsBetween(form.checkIn, form.checkOut);
    if (!form.guest.trim() || !form.checkIn || !form.checkOut || nights < 1) { setNotice("Enter guest details and a valid check-in/check-out date range."); return; }
    if (overlaps(room, form.checkIn, form.checkOut)) { setNotice("That room already has an overlapping active reservation. Choose another room or dates."); return; }
    const item: Booking = { id: crypto.randomUUID(), guest: form.guest.trim(), phone: form.phone.trim(), room, checkIn: form.checkIn, checkOut: form.checkOut, status: form.status, paid: Math.max(0, Number(form.paid) || 0), notes: form.notes.trim() };
    setBookings(prev => [...prev, item]);
    setShowForm(false);
    setNotice("Reservation saved in this browser. Configure the database before using this for live bookings.");
    setForm({ guest: "", phone: "", room: "1", checkIn: "", checkOut: "", status: "Reserved", paid: "0", notes: "" });
  }

  function updateStatus(id: string, status: Booking["status"]) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  const occupiedRooms = rooms.filter(room => active.some(b => b.room === room && b.checkIn <= today && b.checkOut > today)).length;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="brand-icon"><BedDouble size={22} /></div><div><p className="eyebrow">IMAGE COFFEE ROASTERY</p><h1>Accommodation Desk</h1></div></div>
        <div className="header-right"><span className="demo-pill"><span /> Browser demo</span><button className="primary" onClick={() => { setNotice(""); setShowForm(true); }}><Plus size={17} /> New reservation</button></div>
      </header>

      <section className="intro"><div><p className="eyebrow">ROOM OPERATIONS</p><h2>Bookings, availability and revenue.</h2><p className="muted">13 rooms · Flat rate {money(RATE)} per room, per night</p></div><div className="date-label"><CalendarDays size={17} /> {new Date().toLocaleDateString("en-UG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div></section>

      <section className="stats">
        <article className="stat-card"><div className="stat-label"><BedDouble size={16} /> Occupied today</div><strong>{occupiedRooms}<small> / 13 rooms</small></strong><div className="meter"><span style={{width: (occupiedRooms / 13 * 100) + "%"}} /></div></article>
        <article className="stat-card"><div className="stat-label"><Users size={16} /> Arrivals today</div><strong>{arrivals.length}</strong><p className="stat-foot">Based on check-in date</p></article>
        <article className="stat-card"><div className="stat-label"><CalendarDays size={16} /> Booked room value</div><strong>{money(expectedRevenue)}</strong><p className="stat-foot">Recorded stays · gross value</p></article>
        <article className="stat-card"><div className="stat-label"><Clock3 size={16} /> Balance outstanding</div><strong>{money(outstanding)}</strong><p className="stat-foot">Estimated stay value less recorded payments</p></article>
      </section>

      {notice && <div className="notice"><CircleAlert size={17} /><span>{notice}</span><button className="icon-button" aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16}/></button></div>}

      <section className="content-grid">
        <div className="panel rooms-panel"><div className="panel-head"><div><h3>Room overview</h3><p className="muted">Room status for today</p></div><span className="legend"><i className="dot available"/> Available <i className="dot occupied"/> Occupied</span></div>
          <div className="room-grid">{rooms.map(room => { const booking = active.find(b => b.room === room && b.checkIn <= today && b.checkOut > today); return <button key={room} className={"room-tile " + (booking ? "room-occupied" : "room-available")} onClick={() => { if (booking) setQuery(booking.guest); else { setForm(f => ({...f, room: String(room), checkIn: today, checkOut: ""})); setShowForm(true); } }}><span className="room-number">Room {String(room).padStart(2,"0")}</span><strong>{booking ? "Occupied" : "Available"}</strong><small>{booking ? booking.guest : money(RATE) + " / night"}</small></button>; })}</div>
          <p className="panel-note">Room availability here uses reservations saved in this browser only.</p>
        </div>
        <div className="panel quick-panel"><div className="panel-head"><div><h3>Quick controls</h3><p className="muted">Daily front-desk tasks</p></div></div>
          <button className="quick-action" onClick={() => { setForm(f => ({...f, status:"Checked in"})); setShowForm(true); }}><span className="quick-icon"><CheckCircle2 size={18}/></span><span><strong>Register walk-in / check-in</strong><small>Create a booking with guest details</small></span><Plus size={16}/></button>
          <button className="quick-action" onClick={() => setQuery("Reserved")}><span className="quick-icon"><CalendarDays size={18}/></span><span><strong>View reservations</strong><small>Find upcoming stays and guest records</small></span><Search size={16}/></button>
          <button className="quick-action" onClick={() => setQuery("Enquiry")}><span className="quick-icon"><Clock3 size={18}/></span><span><strong>Follow up enquiries</strong><small>Filter reservations marked as enquiry</small></span><Search size={16}/></button>
          <div className="rate-card"><p className="eyebrow">STANDARD RATE</p><strong>{money(RATE)}</strong><span>Per room · per night</span><p>13 rooms · Maximum gross room revenue {money(RATE * 13)} per night at full occupancy.</p></div>
        </div>
      </section>

      <section className="panel bookings-panel"><div className="panel-head booking-head"><div><h3>Reservations</h3><p className="muted">{bookings.length} records in this browser</p></div><div className="searchbox"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search guest, phone, room or status" /></div></div>
        {filtered.length === 0 ? <div className="empty"><CalendarDays size={28}/><strong>No matching reservations</strong><p>Create a reservation to start tracking stays in this demo.</p></div> : <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Room</th><th>Stay</th><th>Value</th><th>Paid</th><th>Status</th><th>Update status</th></tr></thead><tbody>{filtered.map(b => { const value = nightsBetween(b.checkIn,b.checkOut)*RATE; return <tr key={b.id}><td><strong>{b.guest}</strong><small>{b.phone || "No phone recorded"}</small></td><td>Room {String(b.room).padStart(2,"0")}</td><td>{b.checkIn}<small>to {b.checkOut}</small></td><td>{money(value)}<small>{nightsBetween(b.checkIn,b.checkOut)} night(s)</small></td><td>{money(b.paid)}</td><td><span className={"status status-" + b.status.toLowerCase().replaceAll(" ","-")}>{b.status}</span></td><td><select aria-label={"Update status for " + b.guest} value={b.status} onChange={e => updateStatus(b.id,e.target.value as Booking["status"])}>{["Enquiry","Reserved","Checked in","Checked out","Cancelled"].map(s => <option key={s}>{s}</option>)}</select></td></tr>; })}</tbody></table></div>}
      </section>
      <footer className="footer"><span>Image Coffee Roastery · Accommodation operations</span><span>Live booking automation requires secure database and messaging setup.</span></footer>

      {showForm && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><p className="eyebrow">GUEST RECORD</p><h3 id="modal-title">New reservation</h3></div><button className="icon-button" aria-label="Close" onClick={() => setShowForm(false)}><X size={20}/></button></div><form onSubmit={addBooking}><label>Guest full name<input required value={form.guest} onChange={e => setForm({...form,guest:e.target.value})} placeholder="Guest name"/></label><label>Phone / WhatsApp<input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+256…" /></label><div className="form-row"><label>Room<select value={form.room} onChange={e => setForm({...form,room:e.target.value})}>{rooms.map(n=><option key={n} value={n}>Room {String(n).padStart(2,"0")}</option>)}</select></label><label>Status<select value={form.status} onChange={e => setForm({...form,status:e.target.value as Booking["status"]})}>{["Enquiry","Reserved","Checked in"].map(s=><option key={s}>{s}</option>)}</select></label></div><div className="form-row"><label>Check-in<input type="date" required min={today} value={form.checkIn} onChange={e => setForm({...form,checkIn:e.target.value})}/></label><label>Check-out<input type="date" required min={form.checkIn || today} value={form.checkOut} onChange={e => setForm({...form,checkOut:e.target.value})}/></label></div><label>Amount paid (UGX)<input type="number" min="0" value={form.paid} onChange={e => setForm({...form,paid:e.target.value})}/></label><label>Notes<textarea rows={2} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} placeholder="Special requests or booking notes"/></label>{form.checkIn && form.checkOut && nightsBetween(form.checkIn,form.checkOut)>0 && <div className="quote"><span>{nightsBetween(form.checkIn,form.checkOut)} night(s) × {money(RATE)}</span><strong>{money(nightsBetween(form.checkIn,form.checkOut)*RATE)}</strong></div>}<button className="primary full" type="submit">Save reservation</button><p className="form-disclaimer">Demo only: records are stored in this browser, not a shared booking database.</p></form></section></div>}
    </main>
  );
}