import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, IndianRupee, MailCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IKImage } from 'imagekitio-react';
import { authHeaders, getStoredAuth } from '../auth';

export default function CarCatalog() {
  const [cars, setCars] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingStep, setBookingStep] = useState('details');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [distance, setDistance] = useState(100);
  const [billAmount, setBillAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/cars/')
      .then(res => res.json())
      .then(data => setCars(data))
      .catch(err => console.error("Failed to fetch cars", err));
  }, []);

  const getCurrentUser = () => {
    return getStoredAuth().user;
  };

  const beginBooking = (car) => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedCar(car);
    setBookingStep('details');
    setBillAmount(null);
    setBookingError('');
  };

  const handleBookingRequest = async () => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setBookingError('');
    try {
      const res = await fetch('/api/book-car/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          car_id: selectedCar.id,
          start_date: startDate,
          end_date: endDate,
          distance: distance
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Booking failed. Please try again.');
      } else {
        setBillAmount(data.total_cost);
        setBookingStep('success');
      }
    } catch (e) {
      console.error(e);
      setBookingError('Booking failed. Please try again.');
    }
    setLoading(false);
  };

  const filteredCars = filter === 'All' ? cars : cars.filter(c => c.type === filter);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black font-display tracking-tight text-white mb-2">Premium Fleet</h1>
          <p className="text-zinc-400">Choose your vehicle. Every car equipped with AeroDrive AI.</p>
        </div>
        
        {/* Sticky Filter Bar */}
        <div className="flex space-x-2 bg-slate-900/80 p-2 rounded-xl border border-white/5 backdrop-blur-xl">
          {['All', 'Sedan', 'SUV', 'Electric', 'Hypercar'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-emerald-500 text-slate-950' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCars.map((car, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={car.id}
            className="group glass-panel rounded-2xl overflow-hidden flex flex-col relative perspective-1000 tilt-card"
          >
            <div className="relative h-64 overflow-hidden bg-slate-900 transform-style-3d">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }} className="w-full h-full">
                <IKImage
                  src={car.image_url}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
              <div className="absolute top-4 right-4">
                {car.availability ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">Available</span>
                ) : (
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-md">Booked</span>
                )}
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-grow relative z-10 bg-slate-950">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black font-display text-white">{car.make}</h3>
                  <p className="text-zinc-400 text-lg">{car.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold text-xl flex items-center"><IndianRupee className="w-5 h-5"/>{car.price_per_day}</span>
                  <span className="text-zinc-500 text-sm">/day</span>
                </div>
              </div>
              
              <div className="flex gap-2 mb-6">
                <span className="bg-white/5 text-zinc-300 text-xs px-2 py-1 rounded border border-white/10">{car.type}</span>
                <span className="bg-white/5 text-zinc-300 text-xs px-2 py-1 rounded border border-white/10">{car.range_miles} mi</span>
                <span className="bg-white/5 text-zinc-300 text-xs px-2 py-1 rounded border border-white/10">{car.horsepower} HP</span>
              </div>
              
              <button 
                onClick={() => car.availability && beginBooking(car)}
                disabled={!car.availability}
                className={`mt-auto w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                  car.availability 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <span>{car.availability ? 'Book Now' : 'Currently Unavailable'}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedCar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="p-8">
                <h3 className="text-3xl font-black font-display text-white mb-2">Book {selectedCar.make} {selectedCar.model}</h3>
                
                {bookingStep === 'details' && (
                  <>
                    <p className="text-zinc-400 mb-8">Select your dates to proceed.</p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">End Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Estimated Distance (miles)</label>
                        <input type="number" value={distance} onChange={e=>setDistance(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button onClick={() => setSelectedCar(null)} className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors">Cancel</button>
                        <button disabled={!startDate || !endDate || loading} onClick={handleBookingRequest} className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {loading ? 'Processing...' : 'Confirm Booking'}
                        </button>
                      </div>
                      {bookingError && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">
                          {bookingError}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {bookingStep === 'success' && (
                  <>
                    <div className="text-center py-4">
                      <MailCheck className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                      <h4 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h4>
                      <p className="text-zinc-400 mb-6">Check your email for the OTP. Use it when you start this rental.</p>
                      {billAmount && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center mb-6">
                          <p className="text-zinc-400 text-sm">Estimated Total Bill</p>
                          <p className="text-3xl font-bold text-emerald-400 flex items-center justify-center"><IndianRupee className="w-6 h-6"/>{billAmount}</p>
                        </div>
                      )}
                      <button onClick={() => navigate('/reservations')} className="w-full py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors">
                        View My Reservations
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
