import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, fetchPrompt, PromptSource, readPromptFile } from './prompt';

const FILE = { version: '0.1', text: 'You are helping…' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readPromptFile', () => {
  it('takes the version and the text the app writes', () => {
    expect(readPromptFile({ ...FILE, extra: 1 })).toEqual(FILE);
  });

  it.each([null, {}, { version: '0.1' }, { version: 1, text: 'x' }, { version: '0.1', text: '' }])('refuses %j', (data) => {
    expect(() => readPromptFile(data)).toThrow('no version or text');
  });
});

describe('fetchPrompt', () => {
  it('asks the server whether the file changed and reads it', async () => {
    const get = vi.fn(() => Promise.resolve(new Response(JSON.stringify(FILE))));
    await expect(fetchPrompt('/prompt.json', get)).resolves.toEqual(FILE);
    expect(get).toHaveBeenCalledWith('/prompt.json', { cache: 'no-cache' });
  });

  it('fails on a missing file', async () => {
    const get = () => Promise.resolve(new Response('nope', { status: 404 }));
    await expect(fetchPrompt('/prompt.json', get)).rejects.toThrow('404');
  });
});

describe('copyText', () => {
  it('writes a text that is here at once', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    await copyText({ writeText }, 'text');
    expect(writeText).toHaveBeenCalledWith('text');
  });

  it('hands a text on its way to the clipboard as a ClipboardItem, inside the tap', async () => {
    class Item {
      constructor(readonly items: Record<string, Promise<Blob>>) {}
    }
    vi.stubGlobal('ClipboardItem', Item);
    const write = vi.fn((_items: Item[]) => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    await copyText({ writeText, write: write as unknown as Clipboard['write'] }, Promise.resolve('later'));
    expect(writeText).not.toHaveBeenCalled();
    const blob = await write.mock.calls[0]![0][0]!.items['text/plain']!;
    expect(await blob.text()).toBe('later');
  });

  it('writes a text on its way when it arrives, without ClipboardItem', async () => {
    vi.stubGlobal('ClipboardItem', undefined);
    const writeText = vi.fn(() => Promise.resolve());
    await copyText({ writeText, write: vi.fn() }, Promise.resolve('later'));
    expect(writeText).toHaveBeenCalledWith('later');
  });
});

describe('PromptSource', () => {
  it('fetches once and then gives the file itself, not a promise', async () => {
    const load = vi.fn(() => Promise.resolve(FILE));
    const source = new PromptSource('/prompt.json', load);
    source.warm();
    await expect(source.get()).resolves.toEqual(FILE);
    expect(source.get()).toEqual(FILE);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('fetches again after a failure', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(FILE);
    const source = new PromptSource('/prompt.json', load);
    source.warm();
    await expect(source.get()).rejects.toThrow('offline');
    await expect(source.get()).resolves.toEqual(FILE);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
