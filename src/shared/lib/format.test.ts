import { describe, expect, it } from 'vitest';
import { formatDuration, formatTracksCount } from './format';

describe('formatDuration', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3599.9)).toBe('59:59');
  });

  it('treats invalid and negative input as zero', () => {
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(-10)).toBe('0:00');
  });
});

describe('formatTracksCount', () => {
  it.each([
    [1, '1 трек'],
    [21, '21 трек'],
    [2, '2 трека'],
    [34, '34 трека'],
    [5, '5 треков'],
    [11, '11 треков'],
    [12, '12 треков'],
    [14, '14 треков'],
    [111, '111 треков'],
    [0, '0 треков'],
  ])('%i → %s', (count, expected) => {
    expect(formatTracksCount(count)).toBe(expected);
  });
});
