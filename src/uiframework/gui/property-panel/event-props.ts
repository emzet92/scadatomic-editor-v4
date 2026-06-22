export const eventProps: Record<string, string> = {
  onClickEvent: "Clicked",
  onDoubleClickEvent: "DoubleClicked",
};

export function isEventProp(key: string) {
  return key in eventProps;
}
