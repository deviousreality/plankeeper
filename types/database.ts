/**
 * Database types for PlantKeeper application
 *
 * This file contains TypeScript type definitions for all database entities.
 * It includes both raw database types (with SQLite integer booleans) and
 * application types (with proper TypeScript booleans).
 */

// =====================================
// User Types
// =====================================

export interface User {
  id: number;
  username: string;
  password: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// =====================================
// Plant Types
// =====================================

// Raw database type (as returned from SQLite)
export interface PlantRow {
  id: number;
  user_id: number;
  name: string;
  species_id: number | null;
  family_id: number | null;
  genus_id: number | null;
  acquired_date: string | null;
  image_url: string | null;
  notes: string | null;
  is_favorite: number; // 0 = false, 1 = true (SQLite boolean)
  created_at: string;
  updated_at: string;
  can_sell: number; // 0 = false, 1 = true (SQLite boolean)
  is_personal: number; // 0 = false, 1 = true (SQLite boolean)
  common_name: string | null;
  flower_color: string | null;
  variety: string | null;
  light_pref: string | null;
  water_pref: string | null;
  soil_type: string | null;
}

// Application type (for Vue/frontend with proper booleans)
export type Plant = {
  id: number;
  user_id: number;
  name: string;
  species_id: number | undefined;
  family_id: number | undefined;
  genus_id: number | undefined;
  acquired_date: string | undefined;
  image_url: string | undefined;
  notes: string | undefined;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  can_sell: boolean;
  is_personal: boolean;
  common_name: string | undefined;
  flower_color: string | undefined;
  variety: string | undefined;
  light_pref: string | undefined;
  water_pref: string | undefined;
  soil_type: string | undefined;
};

// Extended Plant type with taxonomy data (for display)
export interface PlantWithTaxonomy extends Plant {
  species?: PlantSpecies;
  family?: PlantFamily;
  genus?: PlantGenus;
}

// =====================================
// Taxonomy Types
// =====================================

export interface PlantFamily {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PlantGenus {
  id: number;
  name: string;
  family_id: number;
  created_at: string;
  updated_at: string;
}

export interface PlantSpecies {
  id: number;
  name: string;
  genus_id: number;
  common_name?: string;
  created_at: string;
  updated_at: string;
}

// =====================================
// Care Types
// =====================================

export interface CareSchedule {
  id: number;
  plant_id: number;
  watering_interval?: number;
  fertilizing_interval?: number;
  last_watered?: string;
  last_fertilized?: string;
  light_needs?: string;
  next_task_date?: string;
}

export interface CareLog {
  id: number;
  plant_id: number;
  action_type: string;
  action_date: string;
  notes?: string;
}

export interface CareTip {
  id: number;
  species: string;
  tip: string;
  source?: string;
  created_at: string;
}

// =====================================
// Market & Inventory Types
// =====================================

export interface MarketPrice {
  id: number;
  plant_id: number;
  date_checked: string;
  price: number;
  created_at?: string;
}

export interface PlantPropagation {
  id: number;
  plant_id: number;
  prop_type?: number;
  seed_source?: string;
  cutting_source?: string;
  prop_date?: string;
  initial_count?: number;
  current_count?: number;
  transplant_date?: string;
  notes?: string;
  zero_count_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlantInventory {
  id: number;
  plant_id: number;
  quantity?: number;
  plant_age?: number;
  plant_size?: number;
  last_watered_date?: string;
  last_fertilized_date?: string;
  location?: string;
  notes?: string;
  acquisition_date?: string;
  status?: string;
  date_death?: string;
  cause_of_death?: string;
  death_notes?: string;
  death_location?: string;
  created_at?: string;
  updated_at?: string;
}

// =====================================
// API Response Types
// =====================================

export interface TaxonomyApiResponse {
  families: PlantFamily[];
  genera: PlantGenus[];
  species: PlantSpecies[];
}

export interface PlantFormData {
  name: string;
  species_id?: number;
  family_id?: number;
  genus_id?: number;
  acquired_date?: string;
  image_url?: string;
  notes?: string;
  is_favorite?: boolean;
  can_sell?: boolean;
  is_personal?: boolean;
  common_name?: string;
  flower_color?: string;
  variety?: string;
  light_pref?: string;
  water_pref?: string;
  soil_type?: string;
}

// =====================================
// Utility Types
// =====================================

export type CreatePlant = Omit<Plant, "id" | "created_at" | "updated_at">;
export type UpdatePlant = Partial<Omit<Plant, "id" | "created_at" | "updated_at">>;

export type CreatePlantFamily = Omit<PlantFamily, "id" | "created_at" | "updated_at">;
export type CreatePlantGenus = Omit<PlantGenus, "id" | "created_at" | "updated_at">;
export type CreatePlantSpecies = Omit<PlantSpecies, "id" | "created_at" | "updated_at">;
