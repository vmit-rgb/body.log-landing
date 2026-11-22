import './styles/fonts.css';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/glass.css';
import './styles/motion.css';
import './styles/install-demo.css';
import { leaveLoading } from './boot';
import { mountInstallDemos } from './install-demo';
import { mountFlight } from './flight';
import { initLanding } from './landing';
import { detectPlatform } from './platform';
import { wireReveal } from './reveal';
import { wireToTop } from './totop';

// B4 (FIXES-1.0.1.md): the drawn phones under the install steps, in the page's language
const demos = mountInstallDemos(document, {
  lang: document.documentElement.lang === 'en' ? 'en' : 'uk',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  icon: `${import.meta.env.BASE_URL}favicon.png`,
});
initLanding(
  document,
  detectPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }),
  // Same breakpoint as the desktop layout in landing.css.
  window.matchMedia('(min-width: 1024px)').matches,
  undefined,
  demos,
);
mountFlight(document);
wireToTop(document);
wireReveal(document, leaveLoading(document, performance.now()));
