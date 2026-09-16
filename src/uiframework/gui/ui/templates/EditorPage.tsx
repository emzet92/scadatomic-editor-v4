import type { ReactNode } from "react";
import { Stack } from "../atoms/Layout";
import { EntityHeader } from "../organisms/EntityHeader";
import { PageContainer, type PageContainerSize } from "./PageLayout";

export type EditorPageProps = {
  title: ReactNode;
  description?: ReactNode | undefined;
  eyebrow?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  size?: PageContainerSize | undefined;
  className?: string | undefined;
};

export function EditorPage({
  title,
  description,
  eyebrow,
  icon,
  actions,
  children,
  size = "md",
  className,
}: EditorPageProps) {
  return (
    <PageContainer size={size} className={className}>
      <Stack gap="xl">
        <EntityHeader title={title} description={description} eyebrow={eyebrow} icon={icon} actions={actions} />
        {children}
      </Stack>
    </PageContainer>
  );
}
