import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Flip } from "gsap/Flip";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  Draggable,
  InertiaPlugin,
  Flip,
  MotionPathPlugin,
  CustomEase,
  useGSAP,
);

ScrollTrigger.config({ ignoreMobileResize: true });

CustomEase.create("press-compress", "M0,0 C0.2,0.1 0.3,0.9 0.5,1 0.7,1.05 0.85,1 1,1");
CustomEase.create("plate-settle", "M0,0 C0.16,1 0.3,1 1,1");
CustomEase.create("ink-spread", "M0,0 C0.1,0.6 0.2,1 0.5,1 0.8,1 0.9,0.4 1,0");

export {
  gsap,
  ScrollTrigger,
  Draggable,
  InertiaPlugin,
  Flip,
  MotionPathPlugin,
  useGSAP,
};
