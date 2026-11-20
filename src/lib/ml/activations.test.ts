import { describe, it, expect } from 'vitest';
import { getActivation, allActivationNames, activationInfo } from '@/lib/ml/activations';

describe('activation functions', () => {
  it('lists all supported activations', () => {
    expect(allActivationNames()).toEqual(['sigmoid', 'relu', 'tanh', 'softmax', 'linear']);
  });

  it('sigmoid maps into (0, 1)', () => {
    const sig = getActivation('sigmoid');
    expect(sig.forward(0)).toBe(0.5);
    expect(sig.forward(10)).toBeCloseTo(1, 1);
    expect(sig.forward(-10)).toBeCloseTo(0, 1);
    expect(sig.derivative(0.5)).toBeCloseTo(0.25, 4);
  });

  it('relu clamps negatives to zero', () => {
    const relu = getActivation('relu');
    expect(relu.forward(-5)).toBe(0);
    expect(relu.forward(0)).toBe(0);
    expect(relu.forward(3)).toBe(3);
    expect(relu.derivative(0)).toBe(0);
    expect(relu.derivative(3)).toBe(1);
  });

  it('tanh maps into (-1, 1)', () => {
    const tanh = getActivation('tanh');
    expect(tanh.forward(0)).toBe(0);
    expect(tanh.forward(10)).toBeCloseTo(1, 5);
    expect(tanh.forward(-10)).toBeCloseTo(-1, 5);
  });

  it('linear is identity', () => {
    const lin = getActivation('linear');
    expect(lin.forward(3.14)).toBe(3.14);
    expect(lin.derivative(0)).toBe(1);
  });

  it('softmax forward matrix rows sum to 1', () => {
    const softmax = getActivation('softmax');
    const out = softmax.forwardMatrix([[1, 2, 3], [0, 0, 0]]);
    expect(out.length).toBe(2);
    expect(out[0].reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(out[1]).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('activation info returns description and range', () => {
    const info = activationInfo('sigmoid');
    expect(info.name).toBe('sigmoid');
    expect(typeof info.description).toBe('string');
    expect(info.range).toBe('(0, 1)');
  });

  it('throws for unknown activation', () => {
    // @ts-expect-error testing unknown name
    expect(() => getActivation('gelu' as any)).toThrow(/Unknown/);
  });
});
