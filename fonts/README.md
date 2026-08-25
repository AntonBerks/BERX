# Fonts — self-hosting slot

The site currently uses the system font stack as a safe, zero-request
default:

  --font: "Inter Tight", Inter, -apple-system, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;

If/when BERX self-hosts "Inter Tight" for pixel-perfect brand typography,
drop the woff2 files here (e.g. inter-tight-500.woff2, inter-tight-600.woff2)
and add to styles/berx.css:

  @font-face{
    font-family:"Inter Tight";
    font-weight:500 700;
    font-display:swap;
    src:url("/fonts/inter-tight-variable.woff2") format("woff2-variations");
  }
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/inter-tight-variable.woff2" crossorigin> in <head>,
  subset to latin + cyrillic only.

Until then, no font files are required and nothing here blocks deployment.
