import { describe, it, expect } from 'vitest';
import { MyExpressionAdapter } from '../src/adapter';

const mockContext = {
  agent: { did: 'did:key:test-agent' },
} as any;

describe('MyExpressionAdapter', () => {
  it('should create and retrieve an expression', async () => {
    const adapter = new MyExpressionAdapter(mockContext);
    const data = { text: 'Hello, AD4M!' };

    const address = await adapter.putAdapter.createPublic(data);
    expect(address).toBeTruthy();

    const expression = await adapter.get(address);
    expect(expression).toBeTruthy();

    const parsed = JSON.parse(expression!.data as string);
    expect(parsed.text).toBe('Hello, AD4M!');
  });

  it('should return null for unknown address', async () => {
    const adapter = new MyExpressionAdapter(mockContext);
    const result = await adapter.get('nonexistent');
    expect(result).toBeNull();
  });
});
