/**
 * Fresco — Core types barrel
 * Single source of truth lives in ./api.ts (mirrors of the FastAPI
 * schemas). This file only re-exports it so `from "../types"` works.
 * Do NOT declare schema types here — they drift from the backend.
 */

export * from "./api";
