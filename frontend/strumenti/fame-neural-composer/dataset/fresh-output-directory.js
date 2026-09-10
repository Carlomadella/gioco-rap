"use strict";
const fs = require("node:fs");
const path = require("node:path");
// Refuse reuse rather than deleting user data or mixing runs. Launchers already
// supply freshly prepared output directories. A failed run needs a new directory.
function prepareFreshOutput(inputDir, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const input = fs.realpathSync(inputDir), output = fs.realpathSync(outputDir);
  const relative = path.relative(input, output);
  if (relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative))) {
    throw new Error("Output must be separate from input.");
  }
  if (fs.readdirSync(output).length) throw new Error("Output directory is not empty: choose a new run directory; existing files were preserved.");
}
module.exports = { prepareFreshOutput };
