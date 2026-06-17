import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Navigation, ShieldCheck } from 'lucide-react';
import { IKImage } from 'imagekitio-react';
import { getStoredAuth } from '../auth';

const getStoredUser = () => {
  return getStoredAuth().user;
};

const isStartDateReached = (startDate) => {
  if (!startDate) return true;
  // Compare using local date (YYYY-MM-DD from backend)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return todayStr >= startDate;
};

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [user] = useState(getStoredUser);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) return;

    fetch(`/api/reservations/${user.id}/`)
      .then(res => res.json())
      .then(data => {
        setReservations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  return (
    <div className="w-full min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.h1
        initial= opacity: 0, y: -20 
        animate= opacity: 1, y: 0 
        className="text-4xl md:text-5xl font-black font-display tracking-tight text-white mb-10"
      >
        My <span className="text-emerald-500">Reservations</span>
      </motion.h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
          <h3 className="text-xl text-white font-semibold mb-4">No reservations found</h3>
          <Link to="/fleet">
            <button className="bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-full hover:bg-emerald-400 transition-colors">
              Browse Fleet
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((res, idx) => {
            const canStartRental = (res.status === 'pending' || res.status === 'reserved') && isStartDateReached(res.start_date);

            return (
              <motion.div
                key={res.id}
                initial= opacity: 0, y: 20 
                animate= opacity: 1, y: 0 
                transition= delay: idx * 0.1 
                className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden group hover:border-emerald-500/50 transition-colors"
              >
                <div className="h-48 overflow-hidden relative">
                  <IKImage src={res.car_image} alt="Car" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                    {res.status}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">{res.car_make} {res.car_model}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-zinc-400">
                      <Calendar className="w-5 h-5 mr-3 text-emerald-400" />
                      <span>{res.start_date} to {res.end_date}</span>
                    </div>
                    <div className="flex items-center text-zinc-400">
                      <Navigation className="w-5 h-5 mr-3 text-emerald-400" />
                      <span>{res.estimated_distance} miles est.</span>
                    </div>
                    <div className="flex items-center text-zinc-400">
                      <span className="font-bold text-emerald-400 text-xl mr-3">${res.total_cost}</span>
                      <span>Total Billed</span>
                    </div>
                  </div>
                  
                  {(res.status === 'pending' || res.status === 'reserved') && (
                    <>
                      <Link to={canStartRental ? `/verify/${res.id}` : '#'}>
                        <button
                          disabled={!canStartRental}
                          title={!canStartRental ? 'You can start this rental on the booking start date.' : ''}
                          className={`w-full font-bold py-3 rounded-xl flex justify-center items-center space-x-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] ${
                            canStartRental
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-zinc-500 cursor-not-allowed shadow-none'
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                          <span>Start Rental</span>
                        </button>
                      </Link>
                      {!canStartRental && (
                        <p className="mt-3 text-xs text-zinc-500">
                          Available on: <span className="text-zinc-300 font-mono">{res.start_date}</span>
                        </p>
                      )}
                    </>
                  )}
                  
                  {res.status === 'active' && (
                    <Link to={`/console/${res.id}`}>
                      <button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-xl flex justify-center items-center space-x-2 transition-colors">
                        <Navigation className="w-5 h-5" />
                        <span>Return to Console</span>
                      </button>
                    </Link>
                  )}
                  
                  {res.status === 'completed' && (
                    <button disabled className="w-full bg-slate-800 text-zinc-500 font-bold py-3 rounded-xl cursor-not-allowed">
                      Ride Completed
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
