export type TimingMap = Record<string, number>;

export function serverTiming(timings: TimingMap): string {
  return Object.entries(timings)
    .filter(([, duration]) => Number.isFinite(duration))
    .map(([name, duration]) => `${name};dur=${Math.max(0, Math.round(duration))}`)
    .join(', ');
}

export function logTiming(route: string, timings: TimingMap): void {
  console.info(JSON.stringify({
    type: 'server_timing',
    route,
    timings: Object.fromEntries(Object.entries(timings).map(([name, duration]) => [name, Math.round(duration)])),
  }));
}

export function elapsed(start: number): number {
  return performance.now() - start;
}
