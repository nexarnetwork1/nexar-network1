/** ISO 3166-1 alpha-2 → approximate lat/lng for globe markers (reference geometry only). */
export const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  US: { lat: 37.09, lng: -95.71 },
  GB: { lat: 55.37, lng: -3.43 },
  DE: { lat: 51.16, lng: 10.45 },
  FR: { lat: 46.22, lng: 2.21 },
  AE: { lat: 23.42, lng: 53.84 },
  SA: { lat: 23.88, lng: 45.07 },
  EG: { lat: 26.82, lng: 30.8 },
  NG: { lat: 9.08, lng: 8.67 },
  IN: { lat: 20.59, lng: 78.96 },
  SG: { lat: 1.35, lng: 103.81 },
  JP: { lat: 36.2, lng: 138.25 },
  AU: { lat: -25.27, lng: 133.77 },
  CA: { lat: 56.13, lng: -106.34 },
  BR: { lat: -14.23, lng: -51.92 },
  CN: { lat: 35.86, lng: 104.19 },
  KR: { lat: 35.9, lng: 127.76 },
  MX: { lat: 23.63, lng: -102.55 },
  TR: { lat: 38.96, lng: 35.24 },
  ZA: { lat: -30.55, lng: 22.93 },
  IT: { lat: 41.87, lng: 12.56 },
  ES: { lat: 40.46, lng: -3.74 },
  NL: { lat: 52.13, lng: 5.29 },
  SE: { lat: 60.12, lng: 18.64 },
  PL: { lat: 51.91, lng: 19.14 },
  ID: { lat: -0.78, lng: 113.92 },
  PH: { lat: 12.87, lng: 121.77 },
  MY: { lat: 4.21, lng: 101.97 },
  TH: { lat: 15.87, lng: 100.99 },
  PK: { lat: 30.37, lng: 69.34 },
  AR: { lat: -38.41, lng: -63.61 },
};

export function countryToGlobePoint(
  code: string,
  width: number,
  height: number,
  rotation: number,
): { x: number; y: number; visible: boolean } | null {
  const coords = COUNTRY_COORDINATES[code.toUpperCase()];
  if (!coords) return null;

  const phi = ((coords.lng + rotation) * Math.PI) / 180;
  const theta = ((90 - coords.lat) * Math.PI) / 180;
  const x3 = Math.sin(theta) * Math.cos(phi);
  const y3 = Math.cos(theta);
  const z3 = Math.sin(theta) * Math.sin(phi);

  if (z3 < 0) return { x: 0, y: 0, visible: false };

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;

  return {
    x: cx + x3 * r,
    y: cy - y3 * r,
    visible: true,
  };
}
