import { Container } from "../components/Container";
import { RuntimeButton } from "../components/RuntimeButton";
import { Text } from "../components/Text";
import type { ComponentRegistry } from "./editor-registry";

export const runtimeRegistry: ComponentRegistry = {
    Container,
    Text,
    Button: RuntimeButton,
};