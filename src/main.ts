import './styles/fonts.css';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/glass.css';
import './styles/motion.css';
import { leaveLoading } from './boot';
import { mountFlight } from './flight';
import { initLanding } from './landing';
import { detectPlatform } from './platform';
import { wireReveal } from './reveal';

initLanding(
  document,
  detectPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }),
  // Same breakpoint as the desktop layout in landing.css.
  window.matchMedia('(min-width: 1024px)').matches,
);
mountFlight(document);
wireReveal(document, leaveLoading(document, performance.now()));
