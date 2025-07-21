// server/api/taxonomy/search.get.ts
import { db } from '~/server/utils/db';

type TaxonomySearchResult = {
  id: number;
  type: 'family' | 'genus' | 'species';
  name: string;
  family_name?: string;
  genus_name?: string;
  common_name?: string;
};

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const searchTerm = query['q'] as string || '';
    
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const searchPattern = `%${searchTerm}%`;
    
    // Search for families
    const families = db
      .prepare(`
        SELECT 
          id, 
          'family' as type, 
          name,
          name as family_name,
          NULL as genus_name
        FROM plant_family
        WHERE name LIKE ?
        ORDER BY name
        LIMIT 10
      `)
      .all(searchPattern) as TaxonomySearchResult[];
    
    // Search for genera
    const genera = db
      .prepare(`
        SELECT 
          g.id, 
          'genus' as type, 
          g.name,
          f.name as family_name,
          g.name as genus_name
        FROM plant_genus g
        JOIN plant_family f ON g.family_id = f.id
        WHERE g.name LIKE ?
        ORDER BY g.name
        LIMIT 10
      `)
      .all(searchPattern) as TaxonomySearchResult[];
    
    // Search for species
    const species = db
      .prepare(`
        SELECT 
          s.id, 
          'species' as type, 
          CASE 
            WHEN s.common_name IS NOT NULL AND s.common_name != '' 
            THEN s.name || ' (' || s.common_name || ')'
            ELSE s.name
          END as name,
          f.name as family_name,
          g.name as genus_name,
          s.common_name
        FROM plant_species s
        JOIN plant_genus g ON s.genus_id = g.id
        JOIN plant_family f ON g.family_id = f.id
        WHERE s.name LIKE ? OR s.common_name LIKE ?
        ORDER BY s.name
        LIMIT 10
      `)
      .all(searchPattern, searchPattern) as TaxonomySearchResult[];
    
    // Combine all results
    return [...families, ...genera, ...species];

  } catch (error) {
    console.error('Error searching taxonomy:', error);
    throw createError({
      statusCode: 500,
      message: 'Server error searching taxonomy data'
    });
  }
});
