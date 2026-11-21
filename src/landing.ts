import { initialTab, type InstallTab } from './install';
import type { Platform } from './platform';
import { wireAccordionMotion } from './accordion';
import { EASE, MS, play, pop, stagger, typeIn, whenDone } from './motion';
import { type Clip, copyText, fetchPrompt, type LoadPrompt, PromptSource } from './prompt';
import { tabFlow } from './stripes';

const TABS: readonly InstallTab[] = ['android', 'iphone'];
const ARROW_KEYS = new Set(['ArrowRight', 'ArrowLeft']);

/** Finds an element the page markup must have; a missing one is a markup bug. */
function required<T extends Element>(doc: Document, selector: string): T {
  const element = doc.querySelector<T>(selector);
  if (!element) throw new Error(`landing markup is missing ${selector}`);
  return element;
}

interface TabParts {
  tab: HTMLButtonElement;
  panel: HTMLElement;
}

function tabParts(doc: Document): Record<InstallTab, TabParts> {
  const parts = (name: InstallTab): TabParts => ({
    tab: required(doc, `[data-tab="${name}"]`),
    panel: required(doc, `#steps-${name}`),
  });
  return { android: parts('android'), iphone: parts('iphone') };
}

function otherTab(current: InstallTab): InstallTab {
  return current === 'android' ? 'iphone' : 'android';
}

function wireTabs(doc: Document, platform: Platform): void {
  const parts = tabParts(doc);
  const group = required<HTMLElement>(doc, '.tabs');
  let current = initialTab(platform);
  const select = (selected: InstallTab): void => {
    for (const name of TABS) {
      const isSelected = name === selected;
      parts[name].tab.setAttribute('aria-selected', String(isSelected));
      parts[name].tab.tabIndex = isSelected ? 0 : -1;
      parts[name].panel.hidden = !isSelected;
    }
  };
  /** A tap or an arrow key: the fill flows to the new tab in stripes, the steps come in one by one. */
  const switchTo = (next: InstallTab): void => {
    if (next === current) return;
    const was = current;
    current = next;
    select(next);
    tabFlow(group, parts[was].tab, parts[next].tab);
    stagger([...parts[next].panel.children]);
  };
  select(current);
  for (const name of TABS) {
    parts[name].tab.addEventListener('click', () => switchTo(name));
    parts[name].tab.addEventListener('keydown', (event) => {
      if (!ARROW_KEYS.has(event.key)) return;
      const next = otherTab(name);
      switchTo(next);
      parts[next].tab.focus();
    });
  }
}

type ShowToast = (text: string, emoticon: string) => void;

/**
 * Toast stays until closed with ×: no timer (accessibility decision, 2026-11-08).
 * It slides in from the top edge (360 ms), the text shows letter by letter, and
 * leaves faster (240 ms), as in the app (MICROINTERACTIONS.md «тост»).
 */
function wireToast(doc: Document): ShowToast {
  const toast = required<HTMLElement>(doc, '.toast');
  const body = required<HTMLElement>(doc, '.toast__text');
  required(doc, '.toast__close').addEventListener('click', () => {
    toast.getAnimations?.().forEach((run) => run.cancel());
    const out = play(toast, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: MS.s, easing: EASE.in, fill: 'forwards' });
    whenDone(out, () => {
      toast.hidden = true;
      out?.cancel();
    });
  });
  return (text, emoticon) => {
    const smile = doc.createElement('span');
    smile.className = 'accent';
    smile.textContent = emoticon;
    body.replaceChildren(`${text} `, smile);
    const coming = toast.hidden;
    toast.getAnimations?.().forEach((run) => run.cancel());
    toast.hidden = false;
    if (coming) play(toast, [{ transform: 'translateY(-100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: MS.m, easing: EASE.out });
    typeIn(body);
  };
}

/** Prompt copying in the page: where the prompt comes from and the clipboard. */
export interface PromptEnv {
  readonly load: LoadPrompt;
  readonly clipboard: Clip | undefined;
}

const BROWSER: PromptEnv = {
  load: (url) => fetchPrompt(url),
  clipboard: globalThis.navigator?.clipboard,
};

function dataOf(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (!value) throw new Error(`landing markup is missing data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} on [data-copy-prompt]`);
  return value;
}

/**
 * Copies the app's prompt (src/prompt.ts). The toast texts live in the
 * markup, so each language page brings its own; «{version}» is the prompt's
 * version, as the app's toast «промпт 0.1 скопійовано».
 */
function wirePrompt(doc: Document, showToast: ShowToast, env: PromptEnv): void {
  const button = required<HTMLElement>(doc, '[data-copy-prompt]');
  const copied = dataOf(button, 'toastCopied');
  const failed = dataOf(button, 'toastFailed');
  const source = new PromptSource(dataOf(button, 'promptSrc'), env.load);
  source.warm();
  button.addEventListener('click', () => {
    pop(button, 1.03);
    const file = source.get();
    const done = env.clipboard
      ? copyText(env.clipboard, file instanceof Promise ? file.then((f) => f.text) : file.text).then(() => file)
      : Promise.reject(new Error('no clipboard'));
    done.then(
      (f) => showToast(copied.replace('{version}', f.version), ':)'),
      () => showToast(failed, '>_<'),
    );
  });
}

/**
 * On a wide screen every accordion starts open (Olesia, 2026-11-20);
 * on a phone only the ones the markup opens.
 */
function openAccordions(doc: Document, isWide: boolean): void {
  if (!isWide) return;
  for (const details of doc.querySelectorAll<HTMLDetailsElement>('[data-accordion]')) {
    details.open = true;
  }
}

export function initLanding(doc: Document, platform: Platform, isWide = false, prompt: PromptEnv = BROWSER): void {
  wireTabs(doc, platform);
  openAccordions(doc, isWide);
  wireAccordionMotion(doc);
  wirePrompt(doc, wireToast(doc), prompt);
}
