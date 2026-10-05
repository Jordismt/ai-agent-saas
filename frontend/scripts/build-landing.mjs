import { build } from "vite";
import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Standard Vite build plus a build-time render of the landing alone.
await build();
const temporary = resolve("node_modules/.cache/resbix-landing-ssr");
try {
  await build({
    build: {
      ssr: "src/modules/landing/seo/entry-server.js",
      outDir: temporary,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: "landing.mjs" } },
    },
  });
  const { render } = await import(
    pathToFileURL(resolve(temporary, "landing.mjs")).href
  );
  const shell = await readFile("dist/index.html", "utf8");
  // Keep the generic SPA shell separate so other URLs never receive landing content.
  const appShell = shell.replace(
    /    <!-- LANDING SEO START -->[\s\S]*?    <!-- LANDING SEO END -->/,
    "    <title>Resbix</title>",
  );
  await writeFile("dist/app.html", appShell);
  const markup = await render();
  const assets = await readdir("dist/assets");
  const landingStyles = assets.filter((name) =>
    /^(LandingView|landingBase)-.*\.css$/.test(name),
  );
  if (landingStyles.length !== 2)
    throw new Error("Missing landing stylesheet assets");
  const styledShell = shell.replace(
    "</head>",
    landingStyles
      .map((name) => `    <link rel="stylesheet" href="/assets/${name}" />`)
      .join("\n") + "\n  </head>",
  );
  await writeFile(
    "dist/index.html",
    styledShell.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div>`,
    ),
  );
  // Direct requests to these fixed private/account URLs also receive an initial noindex.
  for (const route of [
    "dashboard",
    "businesses",
    "settings",
    "login",
    "register",
    "forgot-password",
    "reset-password",
  ]) {
    await mkdir(`dist/${route}`, { recursive: true });
    await writeFile(
      `dist/${route}/index.html`,
      appShell.replace(
        "<title>Resbix</title>",
        '<title>Resbix</title><meta name="robots" content="noindex, nofollow" />',
      ),
    );
  }
  console.log(
    `Landing prerendered: ${Buffer.byteLength(markup)} bytes of visible HTML. Separate SPA shell written.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
