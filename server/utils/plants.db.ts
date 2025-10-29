import { Plant, PlantTableRow } from '~/types';
import { PlantModelPost } from '~/types/plant-models';

const validateFieldName = (plantModel: PlantModelPost) => {
  if (!plantModel.name || plantModel.name.trim().length === 0) {
    // console.error('Validation failed - missing or empty name:', plantModel.name);
    throw createError({
      statusCode: 500,
      message: 'Plant name is required and cannot be empty',
    });
  }
};

const validateTaxonomyIds = (plantModel: PlantModelPost) => {
  // Validate taxonomy IDs exist if provided (check for valid positive integers)
  if (plantModel.family_id && plantModel.family_id > 0) {
    const family = db.prepare('SELECT id FROM plant_family WHERE id = ?').get(plantModel.family_id);
    if (!family) {
      // console.error('Validation failed - family_id not found:', plantModel.family_id);
      throw createError({
        statusCode: 500,
        message: `Family with ID ${plantModel.family_id} does not exist`,
      });
    }
  }

  if (plantModel.genus_id && plantModel.genus_id > 0) {
    const genus = db.prepare('SELECT id FROM plant_genus WHERE id = ?').get(plantModel.genus_id);
    if (!genus) {
      // console.error('Validation failed - genus_id not found:', plantModel.genus_id);
      throw createError({
        statusCode: 500,
        message: `Genus with ID ${plantModel.genus_id} does not exist`,
      });
    }
  }

  if (plantModel.species_id && plantModel.species_id > 0) {
    const species = db.prepare('SELECT id FROM plant_species WHERE id = ?').get(plantModel.species_id);
    if (!species) {
      // console.error('Validation failed - species_id not found:', plantModel.species_id);
      throw createError({
        statusCode: 500,
        message: `Species with ID ${plantModel.species_id} does not exist`,
      });
    }
  }
};

const mapPlantBodyToDbFields = (body: PlantModelPost) => {
  return {
    user_id: body.user_id,
    name: body.name,
    species_id: body.species_id,
    family_id: body.family_id,
    genus_id: body.genus_id,
    common_name: body.common_name,
    variety: body.variety,
    flower_color: body.flower_color,
    is_personal: body.is_personal ? 1 : 0,
    is_favorite: body.is_favorite ? 1 : 0,
    acquired_date: body.acquired_date,
    notes: body.notes,
    light_pref: body.light_pref,
    water_pref: body.water_pref,
    soil_type: body.soil_type,
    plant_zones: body.plant_zones,
    plant_use: body.plant_use,
    has_fragrance: body.has_fragrance ? 1 : 0,
    fragrance_description: body.fragrance_description,
    is_petsafe: body.is_petsafe ? 1 : 0,
    can_sell: body.can_sell ? 1 : 0,
  };
};

/**
 * Helper function to convert SQLite Plant row to application Plant type
 * Converts integer booleans (0/1) to actual booleans and null to undefined
 * @param {PlantTableRow} row - Database row with integer booleans and potential nulls
 * @returns {Plant} - Plant object with proper boolean types and undefined instead of null
 */
const plantTableRowToPlant = (row: PlantTableRow): Plant => {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    species_id: row.species_id ?? undefined,
    family_id: row.family_id ?? undefined,
    genus_id: row.genus_id ?? undefined,
    is_favorite: Boolean(row.is_favorite),
    created_at: row.created_at,
    updated_at: row.updated_at,
    can_sell: Boolean(row.can_sell),
    is_personal: Boolean(row.is_personal),
    has_fragrance: Boolean(row.has_fragrance),
    is_petsafe: Boolean(row.is_petsafe),
    acquired_date: row.acquired_date ?? undefined,
    notes: row.notes ?? undefined,
    common_name: row.common_name ?? undefined,
    flower_color: row.flower_color ?? undefined,
    variety: row.variety ?? undefined,
    light_pref: row.light_pref ?? undefined,
    water_pref: row.water_pref ?? undefined,
    soil_type: row.soil_type ?? undefined,
    plant_use: row.plant_use ?? undefined,
    fragrance_description: row.fragrance_description ?? undefined,
    plant_zones: row.plant_zones ?? undefined,
    personal_count: row.personal_count ?? undefined,
  };
};

const plantTableRowToPlantTableRowForSearch = (row: PlantTableRow) => {
  return {
    ...plantTableRowToPlant(row),
    species: '',
    family: '',
    genus: '',
  };
};

export {
  mapPlantBodyToDbFields,
  plantTableRowToPlant,
  plantTableRowToPlantTableRowForSearch,
  validateFieldName,
  validateTaxonomyIds,
};
