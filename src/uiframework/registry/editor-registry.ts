import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { Text } from "../components/Text";


export type ScadatomicComponent<P = any> = React.ComponentType<
  P & {
    children?: React.ReactNode;
    "data-node-id"?: string;
  }
>;

export type ComponentRegistry = Record<string, ScadatomicComponent>;

export const editorRegistry: ComponentRegistry  = {
  Container,
  Text,
  Button,
};