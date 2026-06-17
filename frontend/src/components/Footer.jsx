import { Link } from 'react-router-dom';
import { CarFront, Globe, MessageSquare, Share2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <CarFront className="w-8 h-8 text-emerald-400" />
              <span className="font-display font-bold text-2xl tracking-tight text-white">
                AeroDrive
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed">
              The future of mobility. Combining state-of-the-art telematics, biometric security, and premium vehicles into one seamless rental experience.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link to="/fleet" className="hover:text-emerald-400 transition-colors">Browse Fleet</Link></li>
              <li><Link to="/verify" className="hover:text-emerald-400 transition-colors">Identity Verification</Link></li>
              <li><Link to="/console" className="hover:text-emerald-400 transition-colors">Live Telematics</Link></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Technology</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Edge-AI Drowsiness</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Siamese CNN Biometrics</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">YOLO Object Detection</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hardware Integration</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Connect</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-slate-950 transition-all">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-slate-950 transition-all">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-slate-950 transition-all">
                <Share2 className="w-5 h-5" />
              </a>
            </div>
            <p className="text-zinc-600 text-xs">
              &copy; {new Date().getFullYear()} AeroDrive Technologies. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
