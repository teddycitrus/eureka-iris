/**
 * Named maritime/air waypoints the voice agent can select.
 * Resolves a 'via' choice into concrete lat/lng waypoints the globe can draw.
 * Keeping the option set tight makes the LLM's job reliable — it picks
 * a label from a closed enum rather than inventing coordinates.
 */

export const REROUTE_PRESETS = {
  "cape-of-good-hope": {
    label: "via Cape of Good Hope",
    waypoints: [
      [-34.36, 18.47],
      [-1.0, -2.0],
    ] as Array<[number, number]>,
  },
  "panama-canal": {
    label: "via Panama Canal",
    waypoints: [[9.08, -79.68]] as Array<[number, number]>,
  },
  "suez-canal": {
    label: "via Suez Canal",
    waypoints: [
      [12.6, 43.4],
      [30.0, 32.5],
    ] as Array<[number, number]>,
  },
  "cape-horn": {
    label: "around Cape Horn",
    waypoints: [
      [-55.98, -67.27],
      [-15.0, -35.0],
    ] as Array<[number, number]>,
  },
  "around-south-america": {
    label: "around South America",
    waypoints: [
      [-15.0, -75.0],
      [-55.98, -67.27],
      [-15.0, -35.0],
    ] as Array<[number, number]>,
  },
  "north-atlantic": {
    label: "via North Atlantic",
    waypoints: [[50.0, -30.0]] as Array<[number, number]>,
  },
  "trans-pacific": {
    label: "trans-Pacific",
    waypoints: [[35.0, 175.0]] as Array<[number, number]>,
  },
  "polar-route": {
    label: "polar route",
    waypoints: [[78.0, 30.0]] as Array<[number, number]>,
  },
  direct: { label: "direct", waypoints: [] as Array<[number, number]> },
} as const;

export type ReroutePreset = keyof typeof REROUTE_PRESETS;

export function isReroutePreset(s: string): s is ReroutePreset {
  return s in REROUTE_PRESETS;
}
