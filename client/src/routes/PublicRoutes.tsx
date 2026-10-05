// src/routes/PublicRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import About from '../pages/About';
import Login from '../pages/Auth/Login';
import PublicNavbar from '../components/Navigation/PublicNavbar';

export default function PublicRoutes() {
  return (
    <div className="min-h-screen flex flex-col pt-20">
      <PublicNavbar />
      <main className="grow flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}