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

export interface PlantTableRow {
  id: number;
  user_id: number;
  name: string;
  species_id: number | null;
  family_id: number | null;
  genus_id: number | null;
  acquired_date: string | null;
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
  plant_use: string | null;
  has_fragrance: number; // 0 = false, 1 = true (SQLite boolean)
  fragrance_description: string | null;
  is_petsafe: number; // 0 = false, 1 = true (SQLite boolean)
  plant_zones: number | null;
  personal_count: number | null;
}

// Application type (for Vue/frontend with proper booleans)
export interface Plant {
  id: number | undefined;
  user_id: number;
  name: string;
  species_id: number | undefined;
  family_id: number | undefined;
  genus_id: number | undefined;
  acquired_date: string | undefined;
  notes: string | undefined;
  is_favorite: boolean; // 0 = false, 1 = true (SQLite boolean)
  created_at: string;
  updated_at: string;
  can_sell: boolean; // 0 = false, 1 = true (SQLite boolean)
  is_personal: boolean; // 0 = false, 1 = true (SQLite boolean)
  common_name: string | undefined;
  flower_color: string | undefined;
  variety: string | undefined;
  light_pref: string | undefined;
  water_pref: string | undefined;
  soil_type: string | undefined;
  plant_use: string | undefined;
  has_fragrance: boolean; // 0 = false, 1 = true (SQLite boolean)
  fragrance_description: string | undefined;
  is_petsafe: boolean; // 0 = false, 1 = true (SQLite boolean)
  plant_zones: number | undefined;
  personal_count: number | undefined;
}

// =====================================
// Taxonomy Types
// =====================================

export interface Species {
  id: number;
  name: string;
  genusId: number;
  commonName?: string;
  created_at: string;
  updated_at: string;
}

export interface Genus {
  id: number;
  name: string;
  familyId: number | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: number;
  name: string;
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
  plantId: number;
  price: number;
  dateChecked: string;
  created_at: string;
  updated_at: string;
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

export interface PersonalPlant {
  id: number;
  plant_id: number;
  count?: number;
  zero_reason?: string;
  container_type?: string;
  created_at: string;
  updated_at: string;
}

// =====================================
// API Response Types
// =====================================

export interface TaxonomyApiResponse {
  families: Family[];
  genera: Genus[];
  species: Species[];
}

export interface PlantFormData {
  name: string;
  species_id?: number;
  family_id?: number;
  genus_id?: number;
  acquired_date?: string;
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
  plant_use?: string;
  has_fragrance?: boolean;
  fragrance_description?: string;
  is_petsafe?: boolean;
  plant_zones?: number;
}

export enum PlantPhotosSizeType {
  Original = 1,
  Medium = 2,
  Small = 3,
}

export interface PlantPhotosTableRow {
  id: number;
  plant_id: number;
  filename: string;
  image: Buffer;
  mime_type: string;
  size_type: PlantPhotosSizeType;
  created_at: string;
  guid: string;
}

export interface PlantPhotos {
  id?: number;
  plant_id: number;
  filename: string;
  image: string;
  mime_type: string;
  size_type: PlantPhotosSizeType;
  created_at?: string;
  guid: string;
}
export type PlantPhotosTableRowInsert = Omit<PlantPhotosTableRow, 'id' | 'created_at'>;

// export type PlantPhotos = PlantPhotosTableRow;
export interface PlantPhotosMockFile {
  plant_id: number;
  file: File;
}
// =====================================
// Utility Types
// =====================================

export type CreatePlant = Omit<Plant, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePlant = Partial<Omit<Plant, 'id' | 'created_at' | 'updated_at'>>;

export type CreatePlantFamily = Omit<Family, 'id' | 'created_at' | 'updated_at'>;
export type CreatePlantGenus = Omit<Genus, 'id' | 'created_at' | 'updated_at'>;
export type CreatePlantSpecies = Omit<Species, 'id' | 'created_at' | 'updated_at'>;

export type CreatePersonalPlant = Omit<PersonalPlant, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePersonalPlant = Partial<Omit<PersonalPlant, 'id' | 'created_at' | 'updated_at'>>;

export interface Migrations {
  id: number;
  name: string;
  applied_at: string;
}
