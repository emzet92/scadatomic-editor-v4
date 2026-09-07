import { createUiDocument, type UiNode } from "../core/document";

const nodes: Record<string, UiNode> = {
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
    type: "Text",
    props: {
      value: "1240 L",
    },
    bindings: {
      value: {
        kind: "tag",
        path: "tank.levelLiters",
      },
    },
  },

  levelPercent: {
    id: "levelPercent",
    type: "Text",
    props: {
      value: "62 %",
    },
    bindings: {
      value: {
        kind: "tag",
        path: "tank.levelPercent",
      },
    },
  },

  flowRate: {
    id: "flowRate",
    type: "Text",
    props: {
      value: "85 m³/h",
    },
    bindings: {
      value: {
        kind: "tag",
        path: "pump.flowRate",
      },
    },
  },

  startButton: {
    id: "startButton",
    type: "Button",
    props: {
      label: "START",
    },
    events: {
      click: {
        handlerId: "startButton.Clicked",
      },
    },
  },

  stopButton: {
    id: "stopButton",
    type: "Button",
    props: {
      label: "STOP",
    },
  },
};

export const initialDocument = createUiDocument("root", nodes);
