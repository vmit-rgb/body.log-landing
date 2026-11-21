/*
 * «скопіювати промпт» on the landing copies the app's own prompt: the app's
 * build writes it as prompt.json (body.log, src/prompt/read.ts), so the text
 * exists once (PROFILE-FORMAT.md, «Where the prompt lives»). The address is
 * in the markup (data-prompt-src).
 */

export interface PromptFile {
  /** The prompt's own version, e.g. «0.1»: shown in the toast. */
  readonly version: string;
  readonly text: string;
}

export type LoadPrompt = (url: string) => Promise<PromptFile>;

/** Accepts only what the app writes: a version and a non-empty text. */
export function readPromptFile(data: unknown): PromptFile {
  const file = data as Partial<Record<keyof PromptFile, unknown>> | null;
  if (typeof file?.version !== 'string' || typeof file.text !== 'string' || !file.text) {
    throw new Error('prompt.json: no version or text');
  }
  return { version: file.version, text: file.text };
}

/** Fetches prompt.json, asking the server whether it changed, so a new prompt arrives at once. */
export function fetchPrompt(url: string, get: typeof fetch = fetch): Promise<PromptFile> {
  return get(url, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`prompt.json: ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then(readPromptFile);
}

export type Clip = Pick<Clipboard, 'writeText'> & Partial<Pick<Clipboard, 'write'>>;

/**
 * Copies a text that may still be on its way. Safari lets a page write to
 * the clipboard only inside the tap itself, so a text that hasn't arrived
 * goes in as a ClipboardItem holding a promise (Safari, Chrome, Firefox 127+);
 * without one, it is written when it arrives.
 */
export function copyText(clipboard: Clip, text: string | Promise<string>): Promise<void> {
  if (typeof text === 'string') return clipboard.writeText(text);
  if (clipboard.write && typeof ClipboardItem === 'function') {
    const blob = text.then((value) => new Blob([value], { type: 'text/plain' }));
    return clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
  }
  return text.then((value) => clipboard.writeText(value));
}

/**
 * Keeps the prompt once it has come, and fetches it again after a failure
 * (a phone that was offline for a moment shouldn't need a reload).
 */
export class PromptSource {
  private file: PromptFile | undefined;
  private pending: Promise<PromptFile> | undefined;

  constructor(private readonly url: string, private readonly load: LoadPrompt) {}

  /** Starts fetching before the tap, so the tap can usually copy at once. */
  warm(): void {
    Promise.resolve(this.get()).catch(() => undefined);
  }

  /** The prompt if it is here already, otherwise the promise of it. */
  get(): PromptFile | Promise<PromptFile> {
    if (this.file) return this.file;
    this.pending ??= this.load(this.url).then(
      (file) => (this.file = file),
      (error: unknown) => {
        this.pending = undefined;
        throw error;
      },
    );
    return this.pending;
  }
}
