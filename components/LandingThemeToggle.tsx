'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingThemeToggle() {
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('documind-landing-theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('landing-dark', dark);
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('landing-dark', next);
    window.localStorage.setItem('documind-landing-theme', next ? 'dark' : 'light');
  };

  return <button type="button" onClick={toggle} className="landing-theme-toggle" aria-label={dark ? 'Use light mode' : 'Use dark mode'}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>;
}
