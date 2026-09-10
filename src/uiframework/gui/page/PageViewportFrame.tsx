import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { PageDeviceMode } from "../../component-props";

type Props = {
  width: number;
  height: number;
  deviceMode: PageDeviceMode;
  children: ReactNode;
};

export function PageViewportFrame({
  width,
  height,
  deviceMode,
  children,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observedHost = host;

    function updateScale() {
      const availableWidth = Math.max(1, observedHost.clientWidth - 40);
      const widthScale = availableWidth / Math.max(1, width);
      const nextScale =
        deviceMode === "desktop"
          ? clamp(widthScale, 0.1, 2)
          : clamp(Math.min(1, widthScale), 0.1, 1);

      setScale((current) =>
        Math.abs(current - nextScale) < 0.001 ? current : nextScale
      );
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(observedHost);

    return () => observer.disconnect();
  }, [deviceMode, width]);

  return (
    <div
      ref={hostRef}
      className="flex w-full justify-center px-5 pb-8 pt-5"
      data-page-viewport-frame
    >
      <div
        className="relative shrink-0"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <div
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
