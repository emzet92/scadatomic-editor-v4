import type { Preview } from "@storybook/react-vite";
import type { ReactNode } from "react";
import "../src/index.css";

function DesignSystemFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--editor-app-bg)] p-8 text-[var(--editor-text)]">
      {children}
    </div>
  );
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <DesignSystemFrame>
        <Story />
      </DesignSystemFrame>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Foundations", "Atoms", "Molecules", "Organisms", "Templates"],
      },
    },
  },
};

export default preview;
