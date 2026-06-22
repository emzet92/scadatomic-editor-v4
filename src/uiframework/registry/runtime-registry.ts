import { Container } from "../components/Container";
import { RuntimeButton } from "../components/RuntimeButton";
import { RuntimeText } from "../components/RuntimeText";
import type { ComponentRegistry } from "./editor-registry";

export const runtimeRegistry: ComponentRegistry = {
    Container,
    Text: RuntimeText,
    Button: RuntimeButton,
};