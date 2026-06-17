import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Car, FileText, RefreshCw, Search, ShieldAlert, Users, Wrench } from 'lucide-react';
import { authHeaders } from '../auth';

const statusOptions = ['pending', 'reserved', 'active', 'completed', 'servicing'];

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bookingEdits, setBookingEdits] = useState({});
  const [carEdits, setCarEdits] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = authHeaders();
      const [bookingsRes, carsRes, damageRes, logsRes] = await Promise.all([
        fetch('/api/admin/bookings/', { headers }),
        fetch('/api/admin/cars/', { headers }),
        fetch('/api/admin/damage-reports/', { headers }),
        fetch('/api/admin/safety-logs/', { headers }),
      ]);

      if (!bookingsRes.ok || !carsRes.ok || !damageRes.ok || !logsRes.ok) {
        throw new Error('Failed to load admin data');
      }

      const [bookingsData, carsData, damageData, logsData] = await Promise.all([
        bookingsRes.json(),
        carsRes.json(),
        damageRes.json(),
        logsRes.json(),
      ]);

      setBookings(bookingsData);
      setCars(carsData);
      setDamageReports(damageData);
      setLogs(logsData);
    } catch (err) {
      setError(err.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(() => {
      fetch('/api/admin/safety-logs/', { headers: authHeaders() })
        .then(res => res.json())
        .then(setLogs)
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((booking) => {
      const user = booking.user || {};
      const haystack = [
        booking.id,
        booking.car_make,
        booking.car_model,
        booking.status,
        user.name,
        user.email,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [bookings, search]);

  const stats = {
    activeRides: bookings.filter(b => b.status === 'active').length,
    warnings: logs.filter(l => l.severity === 'WARNING').length,
    critical: logs.filter(l => l.severity === 'CRITICAL').length,
    verifiedUsers: new Set(bookings.filter(b => b.user?.is_verified).map(b => b.user?.id)).size,
  };

  const updateBookingEdit = (bookingId, patch) => {
    const booking = bookings.find(b => b.id === bookingId) || {};
    const current = bookingEdits[bookingId] || {
      status: booking.status,
      damage_reported: Boolean(booking.damage_reported),
      damage_notes: booking.damage_notes || '',
      servicing: Boolean(booking.servicing),
    };
    setBookingEdits((prev) => ({
      ...prev,
      [bookingId]: { ...current, ...patch },
    }));
  };

  const updateCarEdit = (carId, patch) => {
    const car = cars.find(c => c.id === carId) || {};
    const current = carEdits[carId] || {
      availability: Boolean(car.availability),
      servicing: Boolean(car.servicing),
    };
    setCarEdits((prev) => ({
      ...prev,
      [carId]: { ...current, ...patch },
    }));
  };

  const submitBookingUpdate = async (bookingId) => {
    const payload = bookingEdits[bookingId];
    if (!payload) return;
    await fetch(`/api/admin/bookings/${bookingId}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    loadAdminData();
  };

  const submitCarUpdate = async (carId) => {
    const payload = carEdits[carId];
    if (!payload) return;
    await fetch(`/api/admin/cars/${carId}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    loadAdminData();
  };

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white mb-2 flex items-center">
            <ShieldAlert className="w-10 h-10 mr-4 text-emerald-500" /> Admin Command Center
          </h1>
          <p className="text-zinc-400">Bookings, fleet status, and document verification in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings, users, vehicles"
              className="w-64 bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={loadAdminData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Rides', value: stats.activeRides, icon: Car, color: 'emerald' },
          { label: 'AI Warnings', value: stats.warnings, icon: Activity, color: 'amber' },
          { label: 'Critical Alerts', value: stats.critical, icon: ShieldAlert, color: 'red' },
          { label: 'Verified Users', value: stats.verifiedUsers, icon: Users, color: 'indigo' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-slate-900 border border-${stat.color}-500/20 rounded-2xl p-6 relative overflow-hidden group tilt-card`}
          >
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-xl group-hover:bg-${stat.color}-500/10 transition-colors`}></div>
            <stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-4 relative z-10`} />
            <div className={`text-4xl font-black text-${stat.color}-50 mb-1 relative z-10 font-mono`}>{stat.value}</div>
            <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider relative z-10">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <section id="bookings" className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" /> Bookings & Documents
          </h3>
          <span className="text-xs text-zinc-500 uppercase tracking-[0.3em]">{filteredBookings.length} entries</span>
        </div>

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading bookings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-zinc-500">
                  <th className="pb-4 font-medium">Booking</th>
                  <th className="pb-4 font-medium">User</th>
                  <th className="pb-4 font-medium">Documents</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Damage</th>
                  <th className="pb-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-zinc-500">No bookings found.</td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const user = booking.user || {};
                    const licenseUrl = booking.driver_license_url || user.driver_license_url;
                    const selfieUrl = booking.driver_selfie_url || user.driver_selfie_url;
                    const edit = bookingEdits[booking.id] || {
                      status: booking.status,
                      damage_reported: Boolean(booking.damage_reported),
                      damage_notes: booking.damage_notes || '',
                      servicing: Boolean(booking.servicing),
                    };

                    return (
                      <tr key={booking.id} className="border-b border-white/5">
                        <td className="py-4">
                          <div className="text-white font-semibold">{booking.car_make} {booking.car_model}</div>
                          <div className="text-zinc-500 text-xs">{booking.start_date} → {booking.end_date}</div>
                        </td>
                        <td className="py-4">
                          <div className="text-white font-semibold">{user.name || booking.user_email || 'Unknown'}</div>
                          <div className="text-zinc-500 text-xs">{user.email || booking.user_email}</div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            {licenseUrl ? (
                              <a className="text-emerald-400 hover:text-emerald-300" href={licenseUrl} target="_blank" rel="noreferrer">License</a>
                            ) : (
                              <span className="text-zinc-500">License missing</span>
                            )}
                            {selfieUrl ? (
                              <a className="text-emerald-400 hover:text-emerald-300" href={selfieUrl} target="_blank" rel="noreferrer">Selfie</a>
                            ) : (
                              <span className="text-zinc-500">Selfie missing</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <select
                            value={edit.status}
                            onChange={(e) => updateBookingEdit(booking.id, { status: e.target.value, servicing: e.target.value === 'servicing' })}
                            className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-400">
                              <input
                                type="checkbox"
                                checked={edit.damage_reported}
                                onChange={(e) => updateBookingEdit(booking.id, { damage_reported: e.target.checked })}
                              />
                              Damage reported
                            </label>
                            <input
                              value={edit.damage_notes}
                              onChange={(e) => updateBookingEdit(booking.id, { damage_notes: e.target.value })}
                              placeholder="Damage notes"
                              className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => submitBookingUpdate(booking.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30"
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="vehicles" className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-400" /> Fleet Status
          </h3>
          <span className="text-xs text-zinc-500 uppercase tracking-[0.3em]">{cars.length} vehicles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-zinc-500">
                <th className="pb-4 font-medium">Vehicle</th>
                <th className="pb-4 font-medium">Availability</th>
                <th className="pb-4 font-medium">Servicing</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => {
                const edit = carEdits[car.id] || {
                  availability: Boolean(car.availability),
                  servicing: Boolean(car.servicing),
                };
                return (
                  <tr key={car.id} className="border-b border-white/5">
                    <td className="py-4">
                      <div className="text-white font-semibold">{car.make} {car.model}</div>
                      <div className="text-zinc-500 text-xs">{car.type}</div>
                    </td>
                    <td className="py-4">
                      <select
                        value={edit.availability ? 'available' : 'unavailable'}
                        onChange={(e) => updateCarEdit(car.id, { availability: e.target.value === 'available' })}
                        className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="available">available</option>
                        <option value="unavailable">unavailable</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <label className="flex items-center gap-2 text-xs text-zinc-400">
                        <input
                          type="checkbox"
                          checked={edit.servicing}
                          onChange={(e) => updateCarEdit(car.id, { servicing: e.target.checked })}
                        />
                        In servicing
                      </label>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => submitCarUpdate(car.id)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-xs font-semibold hover:bg-white/10"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="damage" className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Damage Reports
          </h3>
          <span className="text-xs text-zinc-500 uppercase tracking-[0.3em]">{damageReports.length} cases</span>
        </div>
        {damageReports.length === 0 ? (
          <div className="text-zinc-500 text-sm">No damage reports filed.</div>
        ) : (
          <div className="space-y-4">
            {damageReports.map((report) => (
              <div key={report.id} className="bg-slate-950 border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-white font-semibold">{report.car_make} {report.car_model}</div>
                    <div className="text-zinc-500 text-xs">Booking {report.id} · {report.user_email}</div>
                  </div>
                  <div className="text-xs text-amber-400 uppercase tracking-[0.3em]">Damage reported</div>
                </div>
                {report.damage_notes && (
                  <div className="mt-3 text-sm text-zinc-300">{report.damage_notes}</div>
                )}
                {Array.isArray(report.damage_images) && report.damage_images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.damage_images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="text-emerald-400 text-xs hover:text-emerald-300">
                        Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="safety" className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" /> Live Safety Logs
          </h3>
          <span className="text-xs text-zinc-500 uppercase tracking-[0.3em]">{logs.length} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-zinc-500">
                <th className="pb-4 font-medium">Timestamp</th>
                <th className="pb-4 font-medium">User ID</th>
                <th className="pb-4 font-medium">Alert Type</th>
                <th className="pb-4 font-medium text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-zinc-500 italic">No events recorded.</td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    log.severity === 'CRITICAL' ? 'bg-red-500/5' : log.severity === 'WARNING' ? 'bg-amber-500/5' : ''
                  }`}>
                    <td className="py-4 text-zinc-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-4 text-white font-bold">{log.user_id}</td>
                    <td className="py-4 text-zinc-300">{log.alert_type}</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                        log.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
