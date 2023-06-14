import esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { htmlPlugin } from "@craftamap/esbuild-plugin-html";

// Make all environment variables available during build
const environmentDefinitions = {};
for (const k in process.env) {
  environmentDefinitions[`process.env.${k}`] = JSON.stringify(process.env[k]);
}

const config = {
  entryPoints: ["src/index.tsx"],
  entryNames: "[dir]/[name]",
  assetNames: "[dir]/[name]",
  bundle: true,
  outdir: "./dist",
  metafile: true,
  sourcemap: true,
  publicPath: "/",
  platform: "browser",
  target: "es2020",
  loader: {
    ".svg": "dataurl",
    ".png": "file",
    ".jpg": "file",
  },
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./public/**/*"],
        to: ["./dist/"],
        keepStructure: true,
      },
    }),
    htmlPlugin({
      files: [
        {
          entryPoints: ["src/index.tsx"],
          filename: "index.html",
          htmlTemplate: "./public/index.html",
        },
      ],
    }),
  ],
  define: environmentDefinitions,
};

// Serve build, watch for changes and live reload
if (process.argv.includes("--serve")) {
  const ctx = await esbuild.context({
    ...config,
    banner: {
      js: ` (() => new EventSource('/esbuild').addEventListener('change', () => location.reload()))();`,
    },
  });

  if (process.argv.includes("--watch")) await ctx.watch();

  const { host, port } = await ctx.serve({
    servedir: "./dist",
    host: process.env.HOST || "localhost",
    port: Number(process.env.PORT || 3000),
  });

  console.log(`Serving on ${host}:${port}`);
}

// Only build
else {
  await esbuild.build(config);
}
