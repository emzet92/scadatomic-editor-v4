import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SuccessToast() {
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    //
    // enter animation
    //
    const enterTimer =
      setTimeout(() => {
        setVisible(true);
      }, 10);

    //
    // start fade out
    //
    const exitTimer =
      setTimeout(() => {
        setVisible(false);
      }, 2500);

    return () => {
      clearTimeout(
        enterTimer
      );

      clearTimeout(
        exitTimer
      );
    };
  }, []);

  return (
    <div
      className={`
        fixed
        top-4
        right-4

        flex
        items-center
        gap-3

        px-4
        py-3

        rounded-xl

        bg-white
        border
        border-emerald-200

        shadow-lg

        z-50

        transition-all
        duration-300

        ${
          visible
            ? `
              opacity-100
              translate-x-0
            `
            : `
              opacity-0
              translate-x-6
            `
        }
      `}
    >
      <CheckCircle2
        className="
          h-5
          w-5
          text-emerald-600
        "
      />

      <div>
        <div
          className="
            text-sm
            font-semibold
            text-zinc-900
          "
        >
          Successfully updated
        </div>

        <div
          className="
            text-xs
            text-zinc-500
          "
        >
          Changes have been saved.
        </div>
      </div>
    </div>
  );
}