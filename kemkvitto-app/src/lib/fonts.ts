import localFont from "next/font/local";

/**
 * The only place the app loads Jost, Figtree and JetBrains Mono.
 *
 * To swap the heading font later, for example to Futura, replace the Jost
 * file under src/fonts and the `src` of `jost` below. Keep the CSS variable
 * name `--font-jost` and `display: "swap"` so layout and components stay put.
 * Figtree is the body face and JetBrains Mono is the bold number face.
 */
export const jost = localFont({
  src: "../fonts/Jost-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-jost",
});

export const figtree = localFont({
  src: "../fonts/Figtree-wght.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--font-figtree",
});

export const jetbrains = localFont({
  src: "../fonts/JetBrainsMono-Bold.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--font-jetbrains",
});

/** Same face as `jetbrains`. Pages already call it `mono`. */
export const mono = jetbrains;
