/**
 * Extended Plant model that includes the new fields
 */
import type { Plant, PlantPhotos } from '.';

// export type PlantModel = Omit<Plant, 'id' | 'user_id' | 'created_at'>;
export type PlantModelPost = Plant & {
  id: number | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
};
export type PlantModelAddNew = Omit<PlantModelPost, 'id' | 'user_id'>;

export interface PlantSpecies {
  id: number;
  name: string;
}

export interface PlantGenus {
  id: number;
  name: string;
  familyId: number;
}

export interface PlantFamily {
  id: number;
  name: string;
}

export interface MarketPrice {
  id: number;
  plantId: number;
  dateChecked: string;
  price: number;
}

export enum PropagationType {
  Seed = 1,
  Cutting = 2,
  Division = 3,
  Offsets = 4,
  Layering = 5,
  Other = 6,
}

export interface PlantPropagation {
  id: number;
  plantId: number;
  propType: PropagationType;
  seedSource?: string;
  cuttingSource?: string;
  propDate?: string;
  initialCount?: number;
  currentCount?: number;
  transplantDate?: string;
  notes?: string;
  zeroCoutNotes?: string;
}

export interface PlantInventory {
  id: number;
  plantId: number;
  quantity?: number;
  plantAge?: number;
  plantSize?: number;
  lastWateredDate?: string;
  lastFertilizedDate?: string;
  location?: string;
  notes?: string;
  acquisitionDate?: string;
  status?: string;
  dateDeath?: string;
  causeOfDeath?: string;
  deathNotes?: string;
  deathLocation?: string;
}

export interface PlantWithInventory {
  inventory?: PlantInventory[];
  marketPrices?: MarketPrice[];
  propagation?: PlantPropagation[];
}
