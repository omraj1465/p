import cron from "node-cron";
import { createSpotlight } from "../controllers/spotlight.controller.js";
const task = () => {
  console.log("Running scheduled task: createSpotlight");
  createSpotlight();
};

// Schedule the task to run every Wednesday at 1:09 AM
cron.schedule("1 0 * * 1", task);
