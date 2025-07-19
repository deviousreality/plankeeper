# Taxonomy API Endpoint

## Overview

The taxonomy API endpoint provides flexible querying of plant taxonomy data based on the hierarchical structure: Family → Genus → Species. All responses use a normalized structure for consistent client consumption.

## Endpoint

`GET /api/taxonomy`

## Query Parameters

- `familyId` (optional): Integer ID of the plant family
- `geniusId` (optional): Integer ID of the plant genus

## Response Structure

All responses follow a consistent normalized structure:

```typescript
{
  families: TaxonomyItem[];        // Array of families (populated when listing all families)
  genera: TaxonomyItem[];          // Array of genera (populated when listing family's genera)
  species: TaxonomyItem[];         // Array of species (populated when listing genus's species)
  family?: TaxonomyItem;           // Single family (present when specific family queried)
  genus?: TaxonomyItem;            // Single genus (present when specific genus queried)
}

type TaxonomyItem = {
  id: number;
  name: string;
}
```

## Usage Scenarios

### 1. Get All Families

**Request:** `GET /api/taxonomy`

```json
{
  "families": [
    {
      "id": 1,
      "name": "Araceae"
    },
    {
      "id": 2,
      "name": "Asparagaceae"
    }
  ],
  "genera": [],
  "species": []
}
```

### 2. Get Family and Its Genera

**Request:** `GET /api/taxonomy?familyId=1`

```json
{
  "families": [],
  "genera": [
    {
      "id": 1,
      "name": "Monstera"
    },
    {
      "id": 2,
      "name": "Sansevieria"
    }
  ],
  "species": [],
  "family": {
    "id": 1,
    "name": "Araceae"
  }
}
```

### 3. Get Family, Genus, and Species

**Request:** `GET /api/taxonomy?familyId=1&geniusId=1`

```json
{
  "families": [],
  "genera": [],
  "species": [
    {
      "id": 1,
      "name": "M. deliciosa"
    }
  ],
  "family": {
    "id": 1,
    "name": "Araceae"
  },
  "genus": {
    "id": 1,
    "name": "Monstera"
  }
}
```

## Error Handling

### Invalid Parameters

**Request:** `GET /api/taxonomy?geniusId=1` (geniusId without familyId)
**Response:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Invalid query parameters. Provide familyId alone, or familyId with geniusId, or no parameters."
}
```

### Not Found

**Request:** `GET /api/taxonomy?familyId=999`
**Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Family not found"
}
```

## Database Schema

The endpoint works with the corrected taxonomy hierarchy:

```sql
-- Family (top level)
CREATE TABLE plant_family (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- Genus (belongs to family)
CREATE TABLE plant_genius (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  family_id INTEGER,
  FOREIGN KEY (family_id) REFERENCES plant_family(id)
);

-- Species (belongs to genus)
CREATE TABLE plant_species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  genus_id INTEGER,
  FOREIGN KEY (genus_id) REFERENCES plant_genius(id)
);
```

## Client Usage Examples

### JavaScript/TypeScript

```typescript
// Get all families
const response = await fetch('/api/taxonomy');
const data = await response.json();
// Use: data.families[]

// Get family and its genera
const response = await fetch('/api/taxonomy?familyId=1');
const data = await response.json();
// Use: data.family, data.genera[]

// Get family, genus, and species
const response = await fetch('/api/taxonomy?familyId=1&geniusId=1');
const data = await response.json();
// Use: data.family, data.genus, data.species[]
```

### Handling Optional Fields

```typescript
// Check if specific family data is present
if (data.family) {
  console.log(`Family: ${data.family.name}`);
}

// Check if specific genus data is present
if (data.genus) {
  console.log(`Genus: ${data.genus.name}`);
}

// Arrays are always present (empty when not applicable)
data.families.forEach((family) => {
  console.log(`Family: ${family.name}`);
});
```

## Benefits of Normalized Structure

1. **Consistent Interface**: Every response uses the same structure
2. **Type Safety**: Single TypeScript interface for all scenarios
3. **No Null Pollution**: Optional fields only appear when they contain data
4. **Predictable**: Client code doesn't need to check response types
5. **Future-Proof**: Easy to extend without breaking existing clients
