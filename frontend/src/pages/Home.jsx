import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, ShieldCheck, Fingerprint, KeySquare, Eye, CarFront } from 'lucide-react';
import GlowCard from '../components/GlowCard';
import AnimatedCounter from '../components/AnimatedCounter';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 mesh-bg opacity-80"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/30 rounded-full blur-[128px] animate-blob mix-blend-screen"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/30 rounded-full blur-[128px] animate-blob mix-blend-screen animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] animate-blob mix-blend-screen animation-delay-4000"></div>

        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter mb-6 leading-tight">
              Drive the <span className="text-gradient">Future.</span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10 font-light">
              AeroDrive combines Edge-AI safety, Aadhaar biometrics, and real-time telematics into one seamless rental experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/fleet">
                <button className="w-full sm:w-auto relative group overflow-hidden bg-emerald-500 text-slate-950 font-bold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <span className="relative z-10 text-lg">Explore Fleet</span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer z-0"></div>
                </button>
              </Link>
              <a href="#how-it-works">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-colors text-lg">
                  How It Works
                </button>
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900/50 border-y border-white/5 py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter value={2400} text="Vehicles" suffix="+" />
            <AnimatedCounter value={99.8} text="Safety Score" suffix="%" />
            <AnimatedCounter value={3} text="Verification" prefix="<" suffix="s" />
            <AnimatedCounter value={0} text="Hidden Fees" prefix="₹" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white mb-4">Seamless Journey</h2>
            <p className="text-xl text-zinc-400">Four steps from screen to street.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 -translate-y-1/2 z-0"></div>

            {[
              { icon: CarFront, title: "Browse Fleet", desc: "Select from our premium catalog." },
              { icon: Fingerprint, title: "Aadhaar + Face", desc: "Instant biometric verification." },
              { icon: KeySquare, title: "OTP Unlock", desc: "Digital key sent to your phone." },
              { icon: Eye, title: "AI Monitors", desc: "Real-time safety telematics." }
            ].map((step, index) => (
              <div key={index} className="relative z-10">
                <GlowCard className="h-full text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <step.icon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Step {index + 1}</h3>
                  <h4 className="text-lg font-semibold text-emerald-400 mb-2">{step.title}</h4>
                  <p className="text-zinc-400">{step.desc}</p>
                </GlowCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USP Section */}
      <section className="py-24 bg-slate-900/30 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white mb-8 leading-tight">
                Engineering <br/> <span className="text-gradient">Trust & Safety</span>
              </h2>
              <div className="space-y-8">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 mt-1"><Fingerprint className="w-6 h-6 text-emerald-400"/></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Aadhaar Biometric Gate</h4>
                    <p className="text-zinc-400 mt-1">Face matched against government ID in under 3 seconds using our proprietary Siamese CNN model.</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 mt-1"><KeySquare className="w-6 h-6 text-emerald-400"/></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">OTP Physical Unlock</h4>
                    <p className="text-zinc-400 mt-1">One-time code sent to your verified phone for instant, keyless car access.</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 mt-1"><Eye className="w-6 h-6 text-emerald-400"/></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Edge-AI Drowsiness Guard</h4>
                    <p className="text-zinc-400 mt-1">On-device CNN continuously monitors eye closure and road attention, alerting you before danger strikes.</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 mt-1"><ShieldCheck className="w-6 h-6 text-emerald-400"/></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Live Telematics HUD</h4>
                    <p className="text-zinc-400 mt-1">In-vehicle dashboard showing AI alerts, speed, and safety scores in real time.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative perspective-1000">
              <motion.div 
                whileHover={{ rotateY: -5, rotateX: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="transform-style-3d"
              >
                <div className="rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Tesla Interior HUD" className="w-full h-auto opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                     <div className="glass-panel p-4 rounded-xl border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse-glow"></div>
                          <span className="text-emerald-400 font-bold uppercase tracking-wider text-sm">System Active</span>
                        </div>
                        <span className="text-white font-mono">100% Secure</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 border-t border-white/5 relative z-20">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold mb-8">Powered By & Integrated With</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="text-2xl font-display font-bold text-white">UIDAI <span className="font-light text-zinc-400">Integrated</span></div>
               <div className="text-2xl font-display font-bold text-white">ISO <span className="font-light text-zinc-400">27001</span></div>
               <div className="text-2xl font-display font-bold text-white">RTO <span className="font-light text-zinc-400">Approved</span></div>
               <div className="text-2xl font-display font-bold text-white">OpenCV <span className="font-light text-zinc-400">Powered</span></div>
            </div>
         </div>
      </section>
    </div>
  );
}
