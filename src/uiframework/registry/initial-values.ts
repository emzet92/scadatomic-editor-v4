import type { UiTree } from "./Renderer";

const stationCardProps = {
    width: "100%",
    minHeight: 260,
    padding: 24,
    gap: 12,
    row: 1,
    borderSize: 1,
    display: "grid",
};

const textBaseProps = {
    color: "black",
    fontSize: 28,
    lineHeight: "34px",
    fontWeight: "normal",
    align: "left",
    variant: "body",
    italic: false,
    underline: false,
    uppercase: false,
    borderSize: 1,
    borderColor: "#bfdbfe",
    borderRadius: 0,
};

const buttonBaseProps = {
    width: "100%",
    height: 72,
};

function createStationNodes(index: number) {
    const prefix = `station${index}`;

    return {
        [`${prefix}Card`]: {
            id: `${prefix}Card`,
            type: "Container",
            props: {
                ...stationCardProps,
            },
            children: [
                `${prefix}Title`,
                `${prefix}LevelLiters`,
                `${prefix}LevelPercent`,
                `${prefix}FlowRate`,
                `${prefix}StartButton`,
                `${prefix}StopButton`,
            ],
        },

        [`${prefix}Title`]: {
            id: `${prefix}Title`,
            type: "Text",
            props: {
                ...textBaseProps,
                value: "Pump Station P-101",
                tag: "pump.stationName",
            },
            children: [],
        },

        [`${prefix}LevelLiters`]: {
            id: `${prefix}LevelLiters`,
            type: "Text",
            props: {
                ...textBaseProps,
                value: "1240 L",
                tag: "tank.levelLiters",
            },
            children: [],
        },

        [`${prefix}LevelPercent`]: {
            id: `${prefix}LevelPercent`,
            type: "Text",
            props: {
                ...textBaseProps,
                value: "62 %",
                tag: "tank.levelPercent",
            },
            children: [],
        },

        [`${prefix}FlowRate`]: {
            id: `${prefix}FlowRate`,
            type: "Text",
            props: {
                ...textBaseProps,
                value: "85 m³/h",
                tag: "pump.flowRate",
            },
            children: [],
        },

        [`${prefix}StartButton`]: {
            id: `${prefix}StartButton`,
            type: "Button",
            props: {
                ...buttonBaseProps,
                label: "START",
                tag: "pump.startCommand",
                onClickEvent: `${prefix}StartButton.Clicked`,
                onDoubleClickEvent: "",
            },
            children: [],
        },

        [`${prefix}StopButton`]: {
            id: `${prefix}StopButton`,
            type: "Button",
            props: {
                ...buttonBaseProps,
                label: "STOP",
                tag: "pump.stopCommand",
                onClickEvent: `${prefix}StopButton.Clicked`,
                onDoubleClickEvent: "",
            },
            children: [],
        },
    };
}

export const initialNodes: UiTree = {
    root: {
        id: "root",
        type: "Container",
        props: {
            width: "100%",
            minHeight: 900,
            padding: 24,
            gap: 24,
            row: 2,
            borderSize: 1,
            display: "grid",
        },
        children: [
            "station1Card",
            "station2Card",
            "station3Card",
            "station4Card",
            "station5Card",
        ],
    },

    ...createStationNodes(1),
    ...createStationNodes(2),
    ...createStationNodes(3),
    ...createStationNodes(4),
    ...createStationNodes(5),
};