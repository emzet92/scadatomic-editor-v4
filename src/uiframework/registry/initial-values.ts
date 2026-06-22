import type { UiTree } from "../Renderer";

export const initialNodes: UiTree = {
  root: {
    id: "root",
    type: "Container",
    props: {
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
    ],
  },

  stationTitle: {
    id: "stationTitle",
    type: "Text",
    props: {
      value: "Pump Station P-101",
      tag: "pump.stationName",
      color: "black"
    },
  },

  levelLiters: {
    id: "levelLiters",
    type: "Text",
    props: {
      value: "1240 L",
      tag: "tank.levelLiters",
    },
  },

  levelPercent: {
    id: "levelPercent",
    type: "Text",
    props: {
      value: "62 %",
      tag: "tank.levelPercent",
    },
  },

  flowRate: {
    id: "flowRate",
    type: "Text",
    props: {
      value: "85 m³/h",
      tag: "pump.flowRate",
    },
  },

  startButton: {
    id: "startButton",
    type: "Button",
    props: {
      label: "START",
      tag: "pump.startCommand",
      onClickEvent: "startButton.Clicked",
      onDoubleClickEvent: ""
    },
  },

  stopButton: {
    id: "stopButton",
    type: "Button",
    props: {
      label: "STOP",
      tag: "pump.stopCommand",
    },
  },
};