import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollSmoother,
  Draggable,
  InertiaPlugin,
  CustomEase,
  CustomBounce,
  useGSAP,
);

ScrollTrigger.config({ ignoreMobileResize: true });

// A heavy drop: a few decaying bounces, each with a matching squash curve.
CustomBounce.create("heft-drop", {
  strength: 0.58,
  squash: 2.2,
  squashID: "heft-drop-squash",
});

export { gsap, ScrollTrigger, ScrollSmoother, Draggable, InertiaPlugin, useGSAP };
