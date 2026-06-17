import { useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert, Activity, Power } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import AlertOverlay from '../components/AlertOverlay';
import { authHeaders, getStoredAuth } from '../auth';

export default function DriverConsole() {
  const [logs, setLogs] = useState([]);
  const [safetyScore, setSafetyScore] = useState(100);
  const [drowsyAlert, setDrowsyAlert] = useState(null);
  const [phoneAlert, setPhoneAlert] = useState(null);
  const [driveDuration, setDriveDuration] = useState(0);
  const [endRideModal, setEndRideModal] = useState(false);
  const [endOtp, setEndOtp] = useState('');
  const [rideEnded, setRideEnded] = useState(false);
  const [consoleReady, setConsoleReady] = useState(false);
  
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  const addLog = useCallback((msg, level) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, level }, ...prev].slice(0, 50));
  }, []);

  const playBuzzer = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    const osc = audioCtxRef.current.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
    osc.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.3);
  }, []);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const frameB64 = canvas.toDataURL('image/jpeg', 0.5);

    // Call Drowsiness API
    fetch('/api/process-drowsiness/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: getStoredAuth().user?.id || 'mockuser_123', frame_b64: frameB64 })
    }).then(res => res.json()).then(data => {
      if (data.drowsy) {
        setDrowsyAlert(data);
        if (data.trigger === 'BUZZER_ACTIVATE') {
          playBuzzer();
          setSafetyScore(s => Math.max(0, s - 5));
          addLog("Drowsiness Detected - CRITICAL", "error");
        } else {
          addLog("Eye Closure Detected - WARNING", "warning");
        }
      } else {
        setDrowsyAlert(null);
      }
    }).catch(() => {});

    // Call Phone API
    fetch('/api/process-phone/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: getStoredAuth().user?.id || 'mockuser_123', frame_b64: frameB64 })
    }).then(res => res.json()).then(data => {
      if (data.phone_detected) {
        setPhoneAlert(data);
        if (data.trigger === 'BUZZER_ACTIVATE') {
          playBuzzer();
          setSafetyScore(s => Math.max(0, s - 10));
          addLog("Phone Usage Detected - CRITICAL", "error");
        }
      } else {
        setPhoneAlert(null);
      }
    }).catch(() => {});
  }, [addLog, playBuzzer]);

  useEffect(() => {
    fetch(`/api/booking/${bookingId}/`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        if (!data.access_granted || data.status !== 'active') {
          navigate(`/verify/${bookingId}`);
        } else {
          setConsoleReady(true);
        }
      })
      .catch(() => navigate(`/verify/${bookingId}`));

    const videoElement = videoRef.current;

    // Setup camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error(err));

    // Timer
    const timer = setInterval(() => setDriveDuration(d => d + 1), 1000);
    
    // Telematics loop (4x second)
    const telematics = setInterval(() => {
      processFrame();
    }, 250);

    return () => {
      clearInterval(timer);
      clearInterval(telematics);
      if (videoElement?.srcObject) {
        videoElement.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [bookingId, navigate, processFrame]);

  const handleEndRideRequest = async () => {
    try {
      await fetch('/api/end-ride-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ booking_id: bookingId })
      });
      setEndRideModal(true);
    } catch(e) {
      console.error(e);
    }
  };

  const confirmEndRide = async () => {
    try {
      const res = await fetch('/api/verify-end-ride/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ booking_id: bookingId, otp: endOtp })
      });
      const data = await res.json();
      if(data.success) setRideEnded(true);
    } catch(e) {
      console.error(e);
    }
  };

  const isCritical = (drowsyAlert?.trigger === 'BUZZER_ACTIVATE') || (phoneAlert?.trigger === 'BUZZER_ACTIVATE');
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!consoleReady) {
    return (
      <div className="min-h-screen bg-black text-white p-4 font-mono w-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono w-full flex flex-col relative overflow-hidden">
      
      {/* HUD Background elements */}
      <div className="absolute inset-0 border-[20px] border-zinc-900 pointer-events-none rounded-3xl"></div>
      
      <AlertOverlay 
        active={isCritical} 
        type="CRITICAL ALERT" 
        message={drowsyAlert?.trigger ? "WAKE UP - DROWSINESS DETECTED" : "PUT DOWN PHONE IMMEDIATELY"} 
      />

      {/* Top Bar */}
      <div className="flex justify-between items-center bg-zinc-950 p-4 border-b border-zinc-800 relative z-10 mb-4 rounded-t-xl">
        <div className="flex items-center space-x-4">
          <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-widest text-emerald-500">AERODRIVE TELEMATICS HUD</h1>
            <p className="text-xs text-zinc-500 uppercase">Live Edge-AI Monitoring Active</p>
          </div>
        </div>
        <div className="flex space-x-8">
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase">Drive Time</p>
            <p className="text-2xl font-bold font-mono">{formatTime(driveDuration)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase">Safety Score</p>
            <p className={`text-2xl font-bold font-mono ${safetyScore > 80 ? 'text-emerald-500' : safetyScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {safetyScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
        
        {/* Left: Camera Feed */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden flex flex-col">
          <div className="p-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <span className="text-xs font-bold text-zinc-400">CAM_01_FRONT_FACING</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-xs text-red-500 font-bold">REC</span>
            </div>
          </div>
          
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-80 mix-blend-screen"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {/* HUD OVERLAY */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Center reticle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-emerald-500/50"></div>
              </div>
              
              {/* Corner Brackets */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-emerald-500/50"></div>
              <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-emerald-500/50"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-emerald-500/50"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-emerald-500/50"></div>

              {/* Status Indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
                <div className={`px-4 py-1 rounded text-xs font-bold uppercase ${drowsyAlert ? (drowsyAlert.trigger ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-amber-500/20 text-amber-500 border border-amber-500') : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
                  EAR: {drowsyAlert ? drowsyAlert.ear.toFixed(2) : '0.35'}
                </div>
                <div className={`px-4 py-1 rounded text-xs font-bold uppercase ${phoneAlert ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
                  YOLO: {phoneAlert ? phoneAlert.confidence.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Event Feed & Controls */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col">
            <h3 className="text-zinc-500 text-xs font-bold uppercase mb-4 border-b border-zinc-800 pb-2">Event Feed</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {logs.map((log, idx) => (
                <div key={idx} className={`text-xs p-2 rounded flex items-start space-x-2 border-l-2 ${log.level === 'error' ? 'bg-red-950/30 border-red-500 text-red-200' : log.level === 'warning' ? 'bg-amber-950/30 border-amber-500 text-amber-200' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>
                  <span className="opacity-50 min-w-[60px]">{log.time}</span>
                  <span>{log.msg}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-zinc-600 text-xs text-center mt-10">No events logged. Drive safely.</div>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <button onClick={handleEndRideRequest} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex items-center justify-center space-x-2 transition-colors">
              <Power className="w-5 h-5" />
              <span>END TRIP & LOCK VEHICLE</span>
            </button>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {endRideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-zinc-950 w-full max-w-md p-8 rounded-2xl border border-red-500/50 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
               {!rideEnded ? (
                 <>
                   <h3 className="text-2xl font-bold text-white mb-2">Confirm Ride End</h3>
                   <p className="text-zinc-400 mb-6">Enter OTP to finish your trip and lock vehicle.</p>
                   <input type="text" value={endOtp} onChange={e=>setEndOtp(e.target.value)} placeholder="OTP CODE" className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white text-center text-2xl tracking-[0.5em] font-mono mb-6 focus:border-red-500 outline-none" />
                   <div className="flex gap-4">
                     <button onClick={() => setEndRideModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 font-bold">Cancel</button>
                     <button onClick={confirmEndRide} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500">End Ride</button>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                     <ShieldAlert className="w-10 h-10" />
                   </div>
                   <h3 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">Trip Completed</h3>
                   <p className="text-zinc-400 mb-6">Your final invoice has been generated.</p>
                   <div className="bg-black p-4 rounded-xl border border-white/10 mb-6 text-left font-mono">
                      <div className="flex justify-between text-zinc-300 mb-2"><span>Safety Score:</span> <span className="text-emerald-500 font-bold">{safetyScore}%</span></div>
                      <div className="flex justify-between text-zinc-300 mb-2"><span>Drive Time:</span> <span className="text-white">{formatTime(driveDuration)}</span></div>
                      <div className="flex justify-between text-zinc-300 font-bold mt-4 pt-4 border-t border-white/10"><span>Final Bill:</span> <span className="text-white">INVOICE SENT</span></div>
                   </div>
                   <button onClick={() => window.location.href = '/reservations'} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 uppercase tracking-widest">Return to Dashboard</button>
                 </>
               )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
