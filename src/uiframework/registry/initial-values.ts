import { createUiDocument, type UiNode } from "../core/document";
import type { ProjectData } from "../data/tags/TagDefinition";

const nodes: Record<string, UiNode> = {
  root: {
    id: "root",
    name: "Page1",
    type: "Page",
    props: {
      deviceMode: "desktop",
      width: 1440,
      height: 900,
      backgroundColor: "#ffffff",
      padding: 24,
      gap: 12,
      columns: 1,
      display: "grid",
    },
    children: ["mainContainer"],
  },

  mainContainer: {
    id: "mainContainer",
    name: "Container1",
    type: "Container",
    props: {
      width: "100%",
      padding: 16,
      gap: 12,
      borderSize: 1,
    },
    children: [
      "stationTitle",
      "levelLiters",
      "levelPercent",
      "flowRate",
      "startButton",
      "stopButton",
      "randomColorButton",
    ],
  },

  stationTitle: {
    id: "stationTitle",
    name: "Text1",
    type: "Text",
    props: {
      value: "Pump Station P-101",
      color: "black",
    },
    bindings: {
      value: {
        kind: "tag",
        path: "pump.stationName",
      },
    },
  },

  levelLiters: {
    id: "levelLiters",
    name: "Text2",
    type: "Text",
    props: { value: "1240 L" },
    bindings: {
      value: { kind: "tag", path: "tank.levelLiters" },
    },
  },

  levelPercent: {
    id: "levelPercent",
    name: "Text3",
    type: "Text",
    props: { value: "62 %" },
    bindings: {
      value: { kind: "tag", path: "tank.levelPercent" },
    },
  },

  flowRate: {
    id: "flowRate",
    name: "Text4",
    type: "Text",
    props: { value: "85 m³/h" },
    bindings: {
      value: { kind: "tag", path: "pump.flowRate" },
    },
  },

  startButton: {
    id: "startButton",
    name: "Button1",
    type: "Button",
    props: { label: "START" },
    events: {
      click: { handlerId: "startButton.Clicked" },
    },
    methods: {
      enable: { scriptId: "startButton.method.enable" },
    },
  },

  stopButton: {
    id: "stopButton",
    name: "Button2",
    type: "Button",
    props: { label: "STOP" },
    events: {
      click: { handlerId: "stopButton.Clicked" },
    },
  },

  randomColorButton: {
    id: "randomColorButton",
    name: "Button3",
    type: "Button",
    props: {
      label: "RANDOM COLOR",
      backgroundColor: "#7c3aed",
    },
    events: {
      click: { handlerId: "randomColorButton.RandomColorClicked" },
    },
  },
};

const initialData: ProjectData = {
  udts: {
    "udt-pump": {
      id: "udt-pump",
      name: "Pump",
      fields: [
        { id: "pump-station-name", name: "stationName", type: { kind: "string" }, defaultValue: "Pump Station P-101" },
        { id: "pump-flow-rate", name: "flowRate", type: { kind: "int" }, defaultValue: 85 },
        { id: "pump-running", name: "running", type: { kind: "bool" }, defaultValue: true },
      ],
      methods: [
        { id: "pump-start", name: "start", source: "self.running = true;" },
        { id: "pump-stop", name: "stop", source: "self.running = false;" },
      ],
    },
    "udt-tank": {
      id: "udt-tank",
      name: "Tank",
      fields: [
        { id: "tank-level-liters", name: "levelLiters", type: { kind: "int" }, defaultValue: 1240 },
        { id: "tank-level-percent", name: "levelPercent", type: { kind: "int" }, defaultValue: 62 },
      ],
      methods: [],
    },
  },
  tags: {
    "tag-pump": {
      id: "tag-pump",
      name: "pump",
      type: { kind: "udt", udtId: "udt-pump" },
      values: {
        stationName: "Pump Station P-101",
        flowRate: 85,
        running: true,
      },
    },
    "tag-tank": {
      id: "tag-tank",
      name: "tank",
      type: { kind: "udt", udtId: "udt-tank" },
      values: {
        levelLiters: 1240,
        levelPercent: 62,
      },
    },
  },
};

export const initialDocument = createUiDocument("root", nodes);
initialDocument.data = initialData;
