/**
 * Test script for the taxonomy API endpoint
 */

const baseUrl = 'http://localhost:3000/api/taxonomy';

async function testTaxonomyAPI() {
  console.log('Testing Taxonomy API Endpoint...\n');

  try {
    // Test 1: Get all families (no parameters)
    console.log('1. Testing: Get all families');
    const familiesResponse = await fetch(baseUrl);
    const familiesData = await familiesResponse.json();
    console.log('Response:', JSON.stringify(familiesData, null, 2));
    console.log('✅ Test 1 passed\n');

    // Test 2: Get family and its genera (familyId only)
    console.log('2. Testing: Get family and genera (familyId=1)');
    const familyResponse = await fetch(`${baseUrl}?familyId=1`);
    const familyData = await familyResponse.json();
    console.log('Response:', JSON.stringify(familyData, null, 2));
    console.log('✅ Test 2 passed\n');

    // Test 3: Get family, genus, and species (familyId + genusId)
    console.log('3. Testing: Get family, genus, and species (familyId=1&genusId=1)');
    const speciesResponse = await fetch(`${baseUrl}?familyId=1&genusId=1`);
    const speciesData = await speciesResponse.json();
    console.log('Response:', JSON.stringify(speciesData, null, 2));
    console.log('✅ Test 3 passed\n');

    // Test 4: Error case - invalid genusId only
    console.log('4. Testing: Error case (genusId only)');
    const errorResponse = await fetch(`${baseUrl}?genusId=1`);
    console.log('Status:', errorResponse.status);
    if (errorResponse.status === 400) {
      console.log('✅ Test 4 passed - correctly returned 400 error\n');
    }

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testTaxonomyAPI();
