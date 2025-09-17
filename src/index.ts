import { logger } from "./utils/logger.js";
import { printCoordinatesAndConfidence } from "./data/firms.js";

async function main() {
  try {
    logger.info("Wildfire AI bootstrap starting...");
    await printCoordinatesAndConfidence();
    logger.info("Done.");
  } catch (err) {
    logger.error("Unhandled error in main:", err);
    process.exitCode = 1;
  }
}

main();
