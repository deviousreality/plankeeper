/**
 * Extended Plant model that includes the new fields
 */
import { PlantListItem } from '.';

export interface PlantDetails extends PlantListItem {
  userId: number;
  species?: string;
  acquiredDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  canSell: boolean;
  isPersonal: boolean;
  commonName?: string;
  flowerColor?: string;
  variety?: string;
  lightPref?: string;
  waterPref?: string;
  soilType?: string;
}

export interface PlantSpecies {
  id: number;
  name: string;
}

export interface PlantGenius {
  id: number;
  name: string;
  speciesId?: number;
}

export interface PlantFamily {
  id: number;
  name: string;
  geniusId?: number;
  speciesId?: number;
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
  Other = 6
}

export interface PlantPropagation {
  id: number;
  plantId: number;
  propType?: PropagationType;
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

export interface PlantWithInventory extends PlantDetails {
  inventory?: PlantInventory[];
  marketPrices?: MarketPrice[];
  propagation?: PlantPropagation[];
}
