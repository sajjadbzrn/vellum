/**
 * Build script for vellum.
 *
 * Compiles TypeScript to ESM JS + type declarations via tsc,
 * optimized for both Bun and Node.js consumption.
 */

console.log("Building vellum...");

const proc = Bun.spawn(
  ["bun", "run", "tsc"],
  { stdio: ["inherit", "inherit", "inherit"] }
);

const exitCode = await proc.exited;
if (exitCode !== 0) {
  process.exit(exitCode);
}

console.log("Build complete — output in dist/");
