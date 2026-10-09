import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing'; // or '../components/pages/Landing'
import About from '../pages/About';
import Login from '../pages/Auth/Login';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import Pricing from '../pages/Pricing';
import Register from '../pages/Auth/Register';

export default function PublicRoutes() {
  return (
    // min-h-screen and flex-col ensures the layout takes up the whole screen
    // and pushes the footer to the very bottom automatically.
    <div className="min-h-screen flex flex-col bg-[#05080c]">
      
      {/* Global Public Header */}
      <Header />
      
      {/* The main content area expands to fill the middle */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />

        </Routes>
      </main>

      {/* Global Public Footer */}
      <Footer />

    </div>
  );
}