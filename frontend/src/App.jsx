import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import CarCatalog from './pages/CarCatalog';
import MyReservations from './pages/MyReservations';
import Verification from './pages/Verification';
import DriverConsole from './pages/DriverConsole';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/fleet" element={<CarCatalog />} />
            <Route path="/reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
            <Route path="/verify/:bookingId" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
            <Route path="/console/:bookingId" element={<ProtectedRoute><DriverConsole /></ProtectedRoute>} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
