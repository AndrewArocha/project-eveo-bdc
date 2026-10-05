// src/routes/PublicRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import Main from '../components/Main'; // Your landing page/shell
import About from '../components/About'; // The mandatory author page

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/about" element={<About />} />
      {/* Future routes to add: 
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      */}
    </Routes>
  );
}