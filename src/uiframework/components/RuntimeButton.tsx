import { Button } from "../components/Button";
import { sendRuntimeEvent } from "./rutime-helpers";

type RuntimeButtonProps = React.ComponentProps<typeof Button> & {
    onClickEvent?: string;
    "data-node-id"?: string;
    onDoubleClickEvent?: string;
};

export function RuntimeButton({

    onClickEvent,
    "data-node-id": nodeId,
    onClick,
    onDoubleClickEvent,
    ...props
}: RuntimeButtonProps) {
    return (
        <Button
            {...props}
            onClick={() => {
                if (!onClickEvent) {
                    return;
                }

                sendRuntimeEvent({
                    event: onClickEvent,
                    nodeId,
                });
            }}
            onDoubleClick={() => {
                if (!onDoubleClickEvent) {
                    return;
                }

                sendRuntimeEvent({
                    event: onDoubleClickEvent,
                    nodeId,
                });
            }}
        />
    );
}