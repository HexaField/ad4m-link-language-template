import { describe, it, expect } from 'vitest';
import { MyLinksAdapter } from '../src/links';

const mockContext = {
  agent: { did: 'did:key:test-agent' },
} as any;

const makeLink = (source: string, target: string, predicate?: string) => ({
  author: 'did:key:test',
  timestamp: new Date().toISOString(),
  data: { source, target, predicate },
  proof: { key: '', signature: '', valid: true, invalid: false },
});

describe('MyLinksAdapter', () => {
  it('should commit and render links', async () => {
    const adapter = new MyLinksAdapter(mockContext);
    const link = makeLink('expr://a', 'expr://b', 'knows');

    const rev = await adapter.commit({ additions: [link], removals: [] });
    expect(rev).toBeTruthy();

    const perspective = await adapter.render();
    expect(perspective.links.length).toBeGreaterThanOrEqual(1);
    expect(perspective.links.some((l: any) => l.data.target === 'expr://b')).toBe(true);
  });

  it('should remove links via commit', async () => {
    const adapter = new MyLinksAdapter(mockContext);
    const link = makeLink('expr://remove-me', 'expr://target', 'test');

    await adapter.commit({ additions: [link], removals: [] });
    await adapter.commit({ additions: [], removals: [link] });

    const perspective = await adapter.render();
    expect(perspective.links.some((l: any) => l.data.source === 'expr://remove-me')).toBe(false);
  });

  it('should report writable and public', () => {
    const adapter = new MyLinksAdapter(mockContext);
    expect(adapter.writable()).toBe(true);
    expect(adapter.public()).toBe(true);
  });
});
