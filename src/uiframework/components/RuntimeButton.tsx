import { Button } from "../components/Button";
import { sendRuntimeEvent } from "./rutime-helpers";

type RuntimeButtonProps = React.ComponentProps<typeof Button> & {
    onClickEvent?: string;
    "data-node-id"?: string;
};

export function RuntimeButton({
    onClickEvent,
    "data-node-id": nodeId,
    onClick,
    ...props
}: RuntimeButtonProps) {
    console.log("RuntimeButton props:", {
        nodeId,
        onClickEvent,
        props,
    });

    return (
        <Button
            {...props}
            data-node-id={nodeId}
            onClick={(event) => {
                onClick?.(event);

                if (!onClickEvent) {
                    return;
                }

                sendRuntimeEvent({
                    event: onClickEvent,
                    nodeId,
                });
            }}
        />
    );
}