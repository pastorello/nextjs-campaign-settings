/**
 * The picker-sized shape the assignment modal (SPEC-008 T4) needs for a
 * Zone or a landmark POI — an id and a display title, nothing else. Both
 * `fetchZones` and `fetchZoneLandmarks` return this same shape.
 */
interface ZoneOption {
  id: number;
  title: string;
}

export default ZoneOption;
