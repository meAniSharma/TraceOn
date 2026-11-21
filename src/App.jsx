import { Route, Routes } from 'react-router-dom';
import { useTheme } from './hooks/useTheme.js';

import Aurora from './components/background/Aurora.jsx';
import ConstellationBg from './components/background/ConstellationBg.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ScrollToHash from './components/layout/ScrollToHash.jsx';

import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const [, toggleTheme] = useTheme();

  return (
    <>
      <Aurora />
      <ConstellationBg />
      <ScrollToHash />
      <Navbar onToggleTheme={toggleTheme} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
    </>
  );
}
