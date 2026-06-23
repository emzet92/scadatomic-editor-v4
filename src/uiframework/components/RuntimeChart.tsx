import {
  useEffect,
  useState,
} from "react";

import { Chart } from "../components/Chart";
import { useRuntimeStore } from "../runtime-store";
import type { ChartNodeProps, ChartPoint } from "../UiTree";


type RuntimeChartProps =
  React.ComponentProps<typeof Chart> &
  ChartNodeProps & {
    historyLimit?: number;
  };

export function RuntimeChart({
  tag,
  points,
  historyLimit = 30,
  ...props
}: RuntimeChartProps) {
  const runtimeValue =
    useRuntimeStore((state) =>
      tag ? state.values[tag] : undefined
    );

  const [runtimePoints, setRuntimePoints] =
    useState<ChartPoint[]>(
      points ?? []
    );

  useEffect(() => {
    if (!tag) {
      return;
    }

    if (runtimeValue === undefined) {
      return;
    }

    const numericValue =
      toNumber(runtimeValue);

    if (numericValue === null) {
      return;
    }

    const label =
      new Date().toLocaleTimeString(
        undefined,
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );

    setRuntimePoints((current) => {
      const next = [
        ...current,
        {
          label,
          value: numericValue,
        },
      ];

      return next.slice(
        Math.max(
          0,
          next.length - historyLimit
        )
      );
    });
  }, [
    tag,
    runtimeValue,
    historyLimit,
  ]);

  return (
    <Chart
      {...props}
      tag={tag}
      points={
        runtimePoints.length > 0
          ? runtimePoints
          : points
      }
    />
  );
}

function toNumber(
  value: unknown
): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const normalized =
      value
        .replace(",", ".")
        .replace(/[^\d.-]/g, "");

    const parsed =
      Number(normalized);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}