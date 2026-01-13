import { Request, Response } from "express";
import {
    normalizeWeightToKg,
    isValidUUID,
    isValidDateFormat,
    isValidUnit,
    fetchAllWeights,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    fetchWeightSummary,
} from "../services/weights.services";
import { AddWeightRequest, UpdateWeightRequest } from "../types/weights.types";

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

// Return weights
export const getWeights = async (_req: Request, res: Response): Promise<void> => {
    try {
        const weights = await fetchAllWeights(TEMP_USER_ID);
        res.json(weights);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch weights" });
    }
};

// Add daily weight
export const addWeight = async (req: Request, res: Response): Promise<void> => {
    const { weight, unit = "kg", entryDate, notes } = req.body as AddWeightRequest;

    // Validation
    if (typeof weight !== "number" || weight <= 0) {
        res.status(400).json({ error: "Weight must be a positive number" });
        return;
    }

    if (!isValidUnit(unit)) {
        res.status(400).json({ error: "Unit must be 'kg' or 'lb'" });
        return;
    }

    const date = entryDate ?? getTodayDate();

    if (!isValidDateFormat(date)) {
        res.status(400).json({ error: "Invalid entryDate format (YYYY-MM-DD)" });
        return;
    }

    const weightKg = normalizeWeightToKg({ value: weight, unit });

    try {
        const entry = await createWeightEntry(TEMP_USER_ID, weightKg, date, notes);
        res.status(201).json(entry);
    } catch (error: any) {
        // Unique constraint: one entry per day
        if (error.code === "23505") {
            res.status(409).json({ error: "Weight already exists for this date" });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Failed to save weight" });
    }
};

// Get weight summary
export const getWeightSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
        const summary = await fetchWeightSummary(TEMP_USER_ID);
        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch weight summary" });
    }
};

// Delete weight entry
export const deleteWeight = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid id format" });
        return;
    }

    try {
        const deleted = await deleteWeightEntry(id, TEMP_USER_ID);

        if (!deleted) {
            res.status(404).json({ error: "Weight entry not found" });
            return;
        }

        res.json({ deleted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete weight" });
    }
};

// Update weight entry
export const updateWeight = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { weight, unit = "kg", entryDate, notes } = req.body as UpdateWeightRequest;

    // Validate UUID format
    if (!isValidUUID(id)) {
        res.status(400).json({ error: "Invalid id format" });
        return;
    }

    if (typeof weight !== "number" || weight <= 0) {
        res.status(400).json({ error: "Weight must be a positive number" });
        return;
    }

    if (!isValidUnit(unit)) {
        res.status(400).json({ error: "Unit must be 'kg' or 'lb'" });
        return;
    }

    const date = entryDate ?? getTodayDate();

    if (!isValidDateFormat(date)) {
        res.status(400).json({ error: "Invalid entryDate format (YYYY-MM-DD)" });
        return;
    }

    const weightKg = normalizeWeightToKg({ value: weight, unit });

    try {
        const updated = await updateWeightEntry(id, TEMP_USER_ID, weightKg, date, notes);

        if (!updated) {
            res.status(404).json({ error: "Weight entry not found" });
            return;
        }

        res.json(updated);
    } catch (error: any) {
        // Uniqueness violation (same day)
        if (error.code === "23505") {
            res.status(409).json({ error: "Weight already exists for this date" });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Failed to update weight" });
    }
};