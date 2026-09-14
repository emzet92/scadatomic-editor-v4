import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../stories/design-system/**/*.stories.@(ts|tsx)"],
  staticDirs: ["../public"],
  docs: {
    autodocs: false,
  },
};

export default config;
