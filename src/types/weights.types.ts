export type WeightUnit = "kg" | "lb";

export interface WeightEntry {
    id: string;
    user_id: string;
    weight_kg: number;
    entry_date: string;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface AddWeightRequest {
    weight: number;
    unit?: WeightUnit;
    entryDate?: string;
    notes?: string;
}

export interface UpdateWeightRequest {
    weight: number;
    unit?: WeightUnit;
    entryDate?: string;
    notes?: string;
}

export interface WeightSummaryResponse {
    currentAverageKg: number | null;
    previousAverageKg: number | null;
    trend: "up" | "down" | "same" | "no_data";
}

export interface DeleteWeightResponse {
    deleted: WeightEntry;
}

export interface ErrorResponse {
    error: string;
}