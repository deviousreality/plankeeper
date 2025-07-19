# PlantKeeper Database Schema

This document outlines the database schema for the PlantKeeper application, including tables, relationships, and field descriptions.

## Core Tables

### users

User authentication and profile information.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `username` - TEXT - Unique username for login
- `password` - TEXT - Encrypted password hash
- `email` - TEXT - User's email address (optional)
- `created_at` - TIMESTAMP - When the user account was created
- `updated_at` - TIMESTAMP - When the user account was last updated

### plants

Core plant information.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `user_id` - INTEGER - Foreign key to users.id
- `name` - TEXT - Plant's name (given by user)
- `species` - TEXT - Botanical species name
- `acquired_date` - DATE - When the plant was acquired
- `image_url` - TEXT - URL or path to plant image
- `notes` - TEXT - General notes about the plant
- `is_favorite` - BOOLEAN - Whether the plant is marked as a favorite
- `can_sell` - BOOLEAN - Whether the plant can be sold
- `is_personal` - BOOLEAN - Whether the plant is for personal use
- `common_name` - TEXT - Common name for the plant
- `flower_color` - TEXT - Color of the plant's flowers
- `variety` - TEXT - Specific variety of the plant
- `light_pref` - TEXT - Light preference (e.g., full sun, partial shade)
- `water_pref` - TEXT - Water preference (e.g., frequent, moderate)
- `soil_type` - TEXT - Preferred soil type
- `created_at` - TIMESTAMP - When the record was created
- `updated_at` - TIMESTAMP - When the record was last updated

## Care Tables

### care_schedules

Plant care scheduling information.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `plant_id` - INTEGER - Foreign key to plants.id
- `watering_interval` - INTEGER - Days between watering
- `fertilizing_interval` - INTEGER - Days between fertilizing
- `last_watered` - DATE - Last date the plant was watered
- `last_fertilized` - DATE - Last date the plant was fertilized
- `light_needs` - TEXT - Light requirements
- `next_task_date` - DATE - Next care task due date

### care_logs

Historical record of care activities.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `plant_id` - INTEGER - Foreign key to plants.id
- `action_type` - TEXT - Type of care action performed
- `action_date` - TIMESTAMP - When the action was performed
- `notes` - TEXT - Notes about the action

### care_tips

Species-specific care tips.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `species` - TEXT - Plant species name
- `tip` - TEXT - The care tip
- `source` - TEXT - Source of the tip
- `created_at` - TIMESTAMP - When the tip was added

## Taxonomy Tables

### plant_species

Standardized plant species catalog.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `name` - TEXT - Species name

### plant_genius

Plant genus classification (taxonomic rank above species).

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `name` - TEXT - Genus name
- `species_id` - INTEGER - Foreign key to plant_species.id

### plant_family

Plant family classification (taxonomic rank above genus).

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `name` - TEXT - Family name
- `genius_id` - INTEGER - Foreign key to plant_genius.id
- `species_id` - INTEGER - Foreign key to plant_species.id

## Inventory & Production Tables

### market_price

Tracking market prices for plants.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `plant_id` - INTEGER - Foreign key to plants.id
- `date_checked` - DATE - When the price was checked
- `price` - DECIMAL(5,2) - Price amount

### plant_propagation

Tracking plant propagation efforts.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `plant_id` - INTEGER - Foreign key to plants.id
- `prop_type` - INTEGER - Type of propagation (1=seed, 2=cutting, 3=division, etc.)
- `seed_source` - TEXT - Source of seeds
- `cutting_source` - TEXT - Source of cuttings
- `prop_date` - DATE - Date propagation was started
- `initial_count` - INTEGER - Initial count of propagated plants
- `current_count` - INTEGER - Current count of surviving plants
- `transplant_date` - DATE - When plants were transplanted
- `notes` - TEXT - General notes
- `zero_cout_notes` - TEXT - Notes for when count reaches zero

### plant_inventory

Detailed plant inventory tracking.

- `id` - INTEGER PRIMARY KEY - Unique identifier
- `plant_id` - INTEGER - Foreign key to plants.id
- `quantity` - INTEGER - Number of plants
- `plant_age` - INTEGER - Age of plants in days or months
- `plant_size` - DECIMAL(5,2) - Size of plants
- `last_watered_date` - DATE - Last watering date
- `last_fertilized_date` - DATE - Last fertilizing date
- `location` - TEXT - Where the plants are located
- `notes` - TEXT - General notes
- `acquisition_date` - DATE - When plants were acquired
- `status` - TEXT - Current status (e.g., healthy, struggling)
- `date_death` - DATE - Date of death if applicable
- `cause_of_death` - TEXT - Cause of death if applicable
- `death_notes` - TEXT - Notes about plant death
- `death_location` - TEXT - Where the plant died

## Entity Relationships

- A user can have many plants
- A plant can have one care schedule
- A plant can have many care logs
- A plant can have many market price entries
- A plant can have many propagation records
- A plant can have many inventory records
- Plant species, genus, and family form a taxonomic hierarchy
