import { Router } from "express";
import {
    addWeight,
    deleteWeight,
    getWeights,
    getWeightSummary,
    updateWeight,
} from "../controllers/weights.controller";

const router = Router();

router.get("/", getWeights);

router.get("/weight-summary", getWeightSummary);

router.post("/", addWeight);

router.put("/:id", updateWeight);

router.delete("/:id", deleteWeight);

export default router;