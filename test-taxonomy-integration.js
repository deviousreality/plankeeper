// Test script to verify the taxonomy API integration
// This simulates what the frontend will do

const API_BASE = 'http://localhost:3000';

async function testTaxonomyFlow() {
  console.log('🧪 Testing Taxonomy API Integration Flow\n');

  try {
    // Step 1: Get all families (initial load)
    console.log('1. Getting all families...');
    const familiesResponse = await fetch(`${API_BASE}/api/taxonomy`);
    const familiesData = await familiesResponse.json();
    console.log(
      '   Families:',
      familiesData.families.map((f) => f.name)
    );

    if (familiesData.families.length === 0) {
      console.log('❌ No families found!');
      return;
    }

    // Step 2: Select first family and get genera
    const selectedFamily = familiesData.families[0];
    console.log(`\n2. Selecting family: ${selectedFamily.name} (ID: ${selectedFamily.id})`);

    const generaResponse = await fetch(`${API_BASE}/api/taxonomy?familyId=${selectedFamily.id}`);
    const generaData = await generaResponse.json();
    console.log(
      '   Genera:',
      generaData.genera.map((g) => g.name)
    );
    console.log('   Family object:', generaData.family);

    if (generaData.genera.length === 0) {
      console.log('❌ No genera found for this family!');
      return;
    }

    // Step 3: Select first genus and get species
    const selectedGenus = generaData.genera[0];
    console.log(`\n3. Selecting genus: ${selectedGenus.name} (ID: ${selectedGenus.id})`);

    const speciesResponse = await fetch(
      `${API_BASE}/api/taxonomy?familyId=${selectedFamily.id}&genusId=${selectedGenus.id}`
    );
    const speciesData = await speciesResponse.json();
    console.log(
      '   Species:',
      speciesData.species.map((s) => s.name)
    );
    console.log('   Family object:', speciesData.family);
    console.log('   Genus object:', speciesData.genus);

    console.log('\n✅ Taxonomy API integration test completed successfully!');

    // Step 4: Simulate frontend form data structure
    console.log('\n4. Frontend form would populate:');
    console.log(
      '   familyOptions:',
      familiesData.families.map((f) => ({ title: f.name, value: f.name, id: f.id }))
    );
    console.log(
      '   genusOptions:',
      generaData.genera.map((g) => ({ title: g.name, value: g.name, id: g.id }))
    );
    console.log(
      '   speciesOptions:',
      speciesData.species.map((s) => ({ title: s.name, value: s.name, id: s.id }))
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTaxonomyFlow();
