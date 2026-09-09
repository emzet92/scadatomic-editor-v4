import { createUiDocument, type UiNode } from "../core/document";

const nodes: Record<string, UiNode> = {
  root: {
    id: "root",
    name: "Container1",
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
    name: "Text3",
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
    name: "Text4",
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
    name: "Button1",
    type: "Button",
    props: {
      label: "START",
    },
    events: {
      click: {
        handlerId: "startButton.Clicked",
      },
    },
    methods: {
      enable: {
        scriptId: "startButton.method.enable",
      },
    },
  },

  stopButton: {
    id: "stopButton",
    name: "Button2",
    type: "Button",
    props: {
      label: "STOP",
    },
    events: {
      click: {
        handlerId: "stopButton.Clicked",
      },
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
      click: {
        handlerId: "randomColorButton.RandomColorClicked",
      },
    },
  },
};

export const initialDocument = createUiDocument("root", nodes);
