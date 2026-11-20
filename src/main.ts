import './styles/fonts.css';
import './styles/tokens.css';
import './styles/landing.css';
import { initLanding } from './landing';
import { detectPlatform } from './platform';

initLanding(
  document,
  detectPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }),
  // Same breakpoint as the desktop layout in landing.css.
  window.matchMedia('(min-width: 1024px)').matches,
);
