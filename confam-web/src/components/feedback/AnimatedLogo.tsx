import { useEffect, useRef } from "react";
import { animate } from "animejs";
import ConfamLogo from "../layout/ConfamLogo";

export default function AnimatedLogo({ size = 56 }: { size?: number }) {
  const logo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = logo.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animation = animate(element, {
      scale: [1, 0.96, 1],
      rotate: [0, -3, 3, 0],
      duration: 1800,
      ease: "inOutSine",
      loop: true,
    });

    return () => {
      animation.cancel();
    };
  }, []);

  return (
    <span ref={logo} className="inline-flex origin-center">
      <ConfamLogo size={size} />
    </span>
  );
}
