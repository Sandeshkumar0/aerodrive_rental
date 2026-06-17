import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, FileText, Fingerprint, KeySquare, Loader2, Navigation, ShieldCheck, Upload } from 'lucide-react';
import { IKImage, IKUpload } from 'imagekitio-react';
import { useNavigate, useParams } from 'react-router-dom';
import { authHeaders } from '../auth';

const imagekitAuthenticator = async () => {
  const res = await fetch('/api/imagekit/auth/');
  if (!res.ok) throw new Error('ImageKit auth failed');
  return res.json();
};

export default function Verification() {
  const { bookingId } = useParams();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== 2 || !navigator.mediaDevices) return;
    const videoElement = videoRef.current;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => console.error("Camera access denied", err));

    return () => {
      if (videoElement?.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const verifyOtp = async () => {
    setIsScanning(true);
    setError('');
    try {
      const res = await fetch('/api/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ booking_id: bookingId, otp, action: 'confirm_booking' })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP verification failed');
      } else {
        setStep(2);
      }
    } catch {
      setError('Could not verify OTP.');
    }
    setIsScanning(false);
  };

  const captureSelfie = async () => {
    setIsScanning(true);
    setError('');

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    }
    const imageB64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const res = await fetch('/api/imagekit/upload/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          image_b64: imageB64,
          folder: '/aerodrive/selfies',
          file_name: `${bookingId}-driver-selfie.jpg`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Selfie upload failed');
      } else {
        setSelfieUrl(data.url);
      }
    } catch {
      setError('Could not upload selfie.');
    }
    setIsScanning(false);
  };

  const verifyIdentity = async () => {
    setIsScanning(true);
    setError('');
    try {
      const res = await fetch('/api/verify-documents/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          booking_id: bookingId,
          license_url: licenseUrl,
          selfie_url: selfieUrl,
          otp
        })
      });
      const data = await res.json();
      setMatchResult(data);
      if (data.verified) setStep(3);
      if (!res.ok) setError(data.error || 'Identity verification failed');
    } catch {
      setError('Could not verify identity.');
    }
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black font-display text-white mb-2">Pre-Ride Security Gate</h1>
          <p className="text-zinc-400">Verify OTP, upload license, and capture current driver photo.</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[
              { num: 1, icon: KeySquare },
              { num: 2, icon: FileText },
              { num: 3, icon: ShieldCheck }
            ].map(s => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  step >= s.num ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/10 bg-slate-900 text-zinc-500'
                } transition-colors`}>
                  <s.icon className="w-5 h-5" />
                </div>
                {s.num < 3 && (
                  <div className={`w-16 h-1 rounded-full mx-2 ${step > s.num ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <KeySquare className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white">Enter Email OTP</h3>
                <p className="text-zinc-400">Use the 6-digit code sent when you booked this vehicle.</p>
                <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" className="w-full max-w-xs mx-auto bg-slate-900 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors text-center tracking-[0.5em] text-2xl font-mono" />
                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3 max-w-xs mx-auto">{error}</div>}
                <button onClick={verifyOtp} disabled={isScanning || otp.length < 6} className="w-full max-w-xs mx-auto py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Fingerprint className="w-5 h-5" /><span>Verify OTP</span></>}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Upload className="w-5 h-5 mr-2 text-emerald-400" /> Driver License</h3>
                    {licenseUrl ? (
                      <IKImage src={licenseUrl} alt="Driver license" className="w-full h-64 object-cover rounded-xl mb-4 border border-white/10" />
                    ) : (
                      <div className="w-full h-64 rounded-xl mb-4 border border-white/10 bg-slate-900 flex items-center justify-center text-zinc-500">No license uploaded</div>
                    )}
                    <IKUpload
                      publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY}
                      urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
                      authenticator={imagekitAuthenticator}
                      folder="/aerodrive/licenses"
                      useUniqueFileName={true}
                      onSuccess={(res) => setLicenseUrl(res.url)}
                      onError={(err) => setError(err.message || 'License upload failed')}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Camera className="w-5 h-5 mr-2 text-emerald-400" /> Current Driver</h3>
                    <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden mb-4 border border-white/10">
                      {selfieUrl ? (
                        <IKImage src={selfieUrl} alt="Current driver" className="w-full h-full object-cover" />
                      ) : (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                      )}
                    </div>
                    <button onClick={captureSelfie} className="w-full py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors flex justify-center items-center space-x-2">
                      {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-5 h-5" /><span>{selfieUrl ? 'Retake Photo' : 'Capture Photo'}</span></>}
                    </button>
                  </div>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3 mb-6">{error}</div>}
                {matchResult && !matchResult.verified && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3 mb-6">Match failed. Confidence: {matchResult.confidence}%</div>}
                <button onClick={verifyIdentity} disabled={!licenseUrl || !selfieUrl || isScanning} className="w-full py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /><span>Verify Identity</span></>}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="done" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-white">Your rental is now ACTIVE</h3>
                <p className="text-emerald-400 font-mono">CONFIDENCE: {matchResult?.confidence}%</p>
                <button onClick={() => navigate(`/console/${bookingId}`)} className="w-full max-w-sm mx-auto py-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex justify-center items-center space-x-2">
                  <Navigation className="w-5 h-5" />
                  <span>Open Driver Console</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
