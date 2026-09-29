export type ProcessZoneKind = "zone" | "station";

export type ProcessZone = {
  id: string;
  name: string;
  kind: ProcessZoneKind;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ProcessSensor = {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Visual/prototype trigger radius. Later this can be replaced by a tag binding. */
  triggerRadius: number;
};

export type ProcessScene = {
  zones: readonly ProcessZone[];
  sensors: readonly ProcessSensor[];
};

export const conveyorDemoScene: ProcessScene = {
  zones: [
    { id: "load-zone", name: "Loading", kind: "zone", x: 35, y: 325, width: 155, height: 90 },
    { id: "inspection-station", name: "Inspection", kind: "station", x: 195, y: 115, width: 115, height: 105 },
    { id: "accepted-zone", name: "Accepted", kind: "zone", x: 455, y: 265, width: 115, height: 100 },
  ],
  sensors: [
    { id: "pe-101", name: "PE-101", x: 250, y: 265, triggerRadius: 32 },
    { id: "pe-102", name: "PE-102", x: 510, y: 240, triggerRadius: 32 },
  ],
};
