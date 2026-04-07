import { Router } from "express"
import {
  getProcessStatusHandler,
  listProcessJobsHandler,
  startFileProcessHandler,
  startTextProcessHandler,
} from "./process-handlers.js"

const router = Router()

router.post("/", startFileProcessHandler)
router.get("/status", getProcessStatusHandler)
router.get("/jobs", listProcessJobsHandler)
router.post("/text", startTextProcessHandler)

export { router as processRouter }
