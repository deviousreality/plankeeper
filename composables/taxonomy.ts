import { ref, computed, watch } from 'vue';
import type { PlantModelPost } from '~/types/plant-models';
import type { FamilyOptions, GenusOptions, SpeciesOptions } from '~/types/taxonomy';

export function useTaxonomy(plantFormData?: Ref<PlantModelPost>) {
  const familyOptions = ref<FamilyOptions[]>([]);
  const genusOptions = ref<GenusOptions[]>([]);
  const speciesOptions = ref<SpeciesOptions[]>([]);

  // Track selected taxonomy IDs for API calls
  const selectedFamilyId = ref<number | undefined>(undefined);
  const selectedGenusId = ref<number | undefined>(undefined);

  // Has Current Taxonomy Selection
  const hasTaxonomySelection = computed(() => {
    return !!(plantFormData?.value.family_id ?? plantFormData?.value.genus_id ?? plantFormData?.value.species_id);
  });

  // Fetch initial family data
  async function fetchFamilies(): Promise<FamilyOptions[] | void> {
    try {
      const response = await $fetch('/api/taxonomy');
      familyOptions.value = response.families.map((family: any) => ({
        title: family.name,
        value: family.name,
        id: family.id,
      }));
    } catch (error) {
      console.error('Error fetching families:', error);
    }
  }

  // Fetch genera for selected family
  async function fetchGenera(familyId?: number): Promise<GenusOptions[] | void> {
    if (!familyId) return;
    try {
      const response = await $fetch(`/api/taxonomy?familyId=${familyId}`);
      genusOptions.value = response.genera.map((genus) => ({
        title: genus.name,
        value: genus.name,
        id: genus.id,
      }));
    } catch (error) {
      console.error('Error fetching genera:', error);
      genusOptions.value = [];
    }
  }

  // Fetch species for selected genus
  async function fetchSpecies(familyId?: number, genusId?: number): Promise<SpeciesOptions[] | void> {
    if (!familyId || !genusId) return;
    try {
      const response = await $fetch(`/api/taxonomy?familyId=${familyId}&genusId=${genusId}`);
      speciesOptions.value = response.species.map((species) => ({
        title: species.name,
        value: species.name,
        id: species.id,
      }));
    } catch (error) {
      console.error('Error fetching species:', error);
      speciesOptions.value = [];
    }
  }

  // Watch for family selection changes
  watch(
    () => plantFormData?.value.family_id,
    async (newFamilyId) => {
      if (newFamilyId) {
        selectedFamilyId.value = newFamilyId;
        await fetchGenera(newFamilyId);
      } else {
        selectedFamilyId.value = undefined;
        selectedGenusId.value = undefined;
        genusOptions.value = [];
        speciesOptions.value = [];
      }
    }
  );

  // Watch for genus selection changes
  watch(
    () => plantFormData?.value.genus_id,
    (newGenusId) => {
      if (newGenusId && selectedFamilyId.value) {
        selectedGenusId.value = newGenusId;
        fetchSpecies(selectedFamilyId.value, newGenusId);
      } else {
        selectedGenusId.value = undefined;
        speciesOptions.value = [];
      }
    }
  );

  // Smart name generation and validation
  const suggestedName = computed(() => {
    const selectedFamily = familyOptions.value.find((f) => f.id === plantFormData?.value.family_id);
    const selectedGenus = genusOptions.value.find((g) => g.id === plantFormData?.value.genus_id);
    const selectedSpecies = speciesOptions.value.find((s) => s.id === plantFormData?.value.species_id);
    if (selectedSpecies) {
      return selectedSpecies.title;
    } else if (selectedGenus) {
      return selectedGenus.title;
    } else if (selectedFamily) {
      return selectedFamily.title;
    }
    return '';
  });

  return {
    familyOptions,
    fetchFamilies,
    fetchGenera,
    fetchSpecies,
    genusOptions,
    hasTaxonomySelection,
    selectedFamilyId,
    selectedGenusId,
    speciesOptions,
    suggestedName,
  };
}
