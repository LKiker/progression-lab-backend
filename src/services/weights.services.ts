import pool from "../db";
import { WeightEntry, WeightUnit } from "../types/weights.types";

interface NormalizeWeightInput {
    value: number;
    unit: WeightUnit;
}

export const normalizeWeightToKg = ({
    value,
    unit,
}: NormalizeWeightInput): number => {
    if (unit === "kg") {
        return value;
    }

    // pounds → kilograms
    return Number((value * 0.45359237).toFixed(2));
};

// Validation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);
export const isValidDateFormat = (date: string): boolean => DATE_REGEX.test(date);
export const isValidUnit = (unit: string): unit is WeightUnit => unit === "kg" || unit === "lb";

// Database operations
export const fetchAllWeights = async (userId: string): Promise<WeightEntry[]> => {
    const result = await pool.query(
        `
        SELECT
            id,
            user_id,
            weight_kg,
            entry_date,
            notes,
            created_at,
            updated_at
        FROM weight_entries
        WHERE user_id = $1
        ORDER BY entry_date DESC
        `,
        [userId]
    );

    return result.rows;
};

export const createWeightEntry = async (
    userId: string,
    weightKg: number,
    date: string,
    notes?: string | null
): Promise<WeightEntry> => {
    const result = await pool.query(
        `
        INSERT INTO weight_entries (
            user_id,
            weight_kg,
            entry_date,
            notes
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [userId, weightKg, date, notes ?? null]
    );

    return result.rows[0];
};

export const updateWeightEntry = async (
    id: string,
    userId: string,
    weightKg: number,
    date: string,
    notes?: string | null
): Promise<WeightEntry | null> => {
    const result = await pool.query(
        `
        UPDATE weight_entries
        SET
            weight_kg = $1,
            entry_date = $2,
            notes = $3,
            updated_at = NOW()
        WHERE id = $4
          AND user_id = $5
        RETURNING *
        `,
        [weightKg, date, notes ?? null, id, userId]
    );

    return result.rowCount === 0 ? null : result.rows[0];
};

export const deleteWeightEntry = async (
    id: string,
    userId: string
): Promise<WeightEntry | null> => {
    const result = await pool.query(
        `
        DELETE FROM weight_entries
        WHERE id = $1 AND user_id = $2
        RETURNING *
        `,
        [id, userId]
    );

    return result.rowCount === 0 ? null : result.rows[0];
};

export const fetchWeightSummary = async (userId: string) => {
    // Current 7-day average (today → 6 days ago)
    const currentResult = await pool.query(
        `
        SELECT AVG(weight_kg) AS avg_weight
        FROM weight_entries
        WHERE user_id = $1
          AND entry_date >= CURRENT_DATE - INTERVAL '6 days'
        `,
        [userId]
    );

    // Previous 7-day average (7 days ago → 13 days ago)
    const previousResult = await pool.query(
        `
        SELECT AVG(weight_kg) AS avg_weight
        FROM weight_entries
        WHERE user_id = $1
          AND entry_date >= CURRENT_DATE - INTERVAL '13 days'
          AND entry_date < CURRENT_DATE - INTERVAL '6 days'
        `,
        [userId]
    );

    const currentAvg = currentResult.rows[0].avg_weight;
    const previousAvg = previousResult.rows[0].avg_weight;

    let trend: "up" | "down" | "same" | "no_data" = "no_data";

    if (currentAvg !== null && previousAvg !== null) {
        if (currentAvg > previousAvg) trend = "up";
        else if (currentAvg < previousAvg) trend = "down";
        else trend = "same";
    }

    return {
        currentAverageKg: currentAvg ? Number(currentAvg) : null,
        previousAverageKg: previousAvg ? Number(previousAvg) : null,
        trend,
    };
};