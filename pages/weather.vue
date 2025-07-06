<!-- pages/weather.vue -->
<template>
  <div>
    <h1 class="text-h3 mb-6">
      Weather Forecast
    </h1>

    <v-card class="mb-6">
      <v-card-text>
        <v-form @submit.prevent="getWeather">
          <v-row>
            <v-col
              cols="12"
              sm="8"
              md="9"
            >
              <v-text-field
                v-model="city"
                label="Enter City"
                placeholder="e.g., London, New York, Tokyo"
                hint="Enter a city name to check the weather"
                required
              />
            </v-col>

            <v-col
              cols="12"
              sm="4"
              md="3"
              class="d-flex align-center"
            >
              <v-btn
                color="primary"
                block
                type="submit"
                :loading="loading"
                :disabled="!city.trim()"
              >
                Get Weather
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="error"
      type="error"
      class="mb-6"
    >
      {{ error }}
    </v-alert>

    <template v-if="weather">
      <!-- Current Weather -->
      <v-row>
        <v-col
          cols="12"
          md="6"
        >
          <v-card class="mb-6">
            <v-card-title class="text-h5">
              Current Weather
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center">
                <div>
                  <img
                    :src="`https://openweathermap.org/img/w/${weather.icon}.png`"
                    :alt="weather.description"
                    height="100"
                  >
                </div>
                <div class="ms-4">
                  <div class="text-h3">
                    {{ weather.temperature }}°C
                  </div>
                  <div class="text-h6 text-capitalize">
                    {{ weather.description }}
                  </div>
                  <div>Feels like: {{ weather.feelsLike }}°C</div>
                </div>
              </div>

              <v-row class="mt-6">
                <v-col
                  cols="6"
                  sm="3"
                >
                  <div class="text-overline">
                    Humidity
                  </div>
                  <div class="text-h6">
                    {{ weather.humidity }}%
                  </div>
                </v-col>

                <v-col
                  cols="6"
                  sm="3"
                >
                  <div class="text-overline">
                    Wind
                  </div>
                  <div class="text-h6">
                    {{ weather.windSpeed }} m/s
                  </div>
                </v-col>

                <v-col
                  cols="6"
                  sm="3"
                >
                  <div class="text-overline">
                    Pressure
                  </div>
                  <div class="text-h6">
                    {{ weather.pressure }} hPa
                  </div>
                </v-col>

                <v-col
                  cols="6"
                  sm="3"
                >
                  <div class="text-overline">
                    Visibility
                  </div>
                  <div class="text-h6">
                    {{ (weather.visibility / 1000).toFixed(1) }} km
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="6"
        >
          <v-card class="mb-6">
            <v-card-title class="text-h5">
              Plant Care Tips
            </v-card-title>
            <v-card-text>
              <v-alert
                color="info"
                variant="tonal"
                class="mb-4"
              >
                <v-icon start>
                  mdi-information
                </v-icon>
                Here are some plant care tips based on the current weather
                conditions.
              </v-alert>

              <v-list>
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary">
                      mdi-water
                    </v-icon>
                  </template>
                  <v-list-item-title>Watering Advice</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ getWateringAdvice() }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="amber-darken-2">
                      mdi-weather-sunny
                    </v-icon>
                  </template>
                  <v-list-item-title>Light Exposure</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ getLightAdvice() }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon color="success">
                      mdi-thermometer
                    </v-icon>
                  </template>
                  <v-list-item-title>
                    Temperature Considerations
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ getTemperatureAdvice() }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Weather Forecast -->
      <v-card v-if="forecast && forecast.length">
        <v-card-title class="text-h5">
          5-Day Forecast
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              v-for="(day, index) in forecast"
              :key="index"
              cols="12"
              sm="6"
              md="4"
              lg="2"
            >
              <v-card
                variant="outlined"
                class="text-center h-100"
              >
                <v-card-title>
                  {{ formatDate(day.date) }}
                </v-card-title>

                <v-card-text>
                  <img
                    :src="`https://openweathermap.org/img/w/${day.icon}.png`"
                    :alt="day.description"
                    height="50"
                  >
                  <div class="text-h5">
                    {{ day.temp }}°C
                  </div>
                  <div class="text-caption text-capitalize">
                    {{ day.description }}
                  </div>
                  <div class="d-flex justify-space-between mt-2">
                    <span>{{ day.min }}°</span>
                    <span>{{ day.max }}°</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <div
      v-else-if="!loading && !weather"
      class="text-center pa-5"
    >
      <v-icon
        size="64"
        color="grey"
        class="mb-4"
      >
        mdi-weather-cloudy
      </v-icon>
      <h3 class="text-h5 mb-3">
        No Weather Data Yet
      </h3>
      <p>
        Search for a city to see the current weather and plant care
        recommendations.
      </p>
    </div>
  </div>
</template>

<script setup>
  definePageMeta({
    middleware: "auth",
  });

  const city = ref("London"); // Default city
  const weather = ref(null);
  const forecast = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Get weather data for the city
  async function getWeather() {
    if (!city.value.trim()) return;

    loading.value = true;
    error.value = null;

    try {
      // Get current weather
      weather.value = await $fetch(
        `/api/weather?city=${encodeURIComponent(city.value)}`
      );

      // Get forecast (would need to create this API endpoint)
      try {
        forecast.value = await $fetch(
          `/api/weather/forecast?city=${encodeURIComponent(city.value)}`
        );
      } catch (e) {
        console.error("Error fetching forecast:", e);
        forecast.value = []; // Forecast is optional
      }
    } catch (e) {
      console.error("Error fetching weather:", e);
      error.value =
        "Failed to fetch weather data. Please check the city name and try again.";
      weather.value = null;
    } finally {
      loading.value = false;
    }
  }

  // Plant care advice based on weather
  function getWateringAdvice() {
    if (!weather.value) return "";

    if (weather.value.humidity < 40) {
      return "The air is dry today. Consider misting humidity-loving plants and check soil moisture more frequently.";
    } else if (weather.value.humidity > 80) {
      return "High humidity today. Be careful not to overwater indoor plants, as evaporation will be slower.";
    } else {
      return "Average humidity levels. Follow your regular watering schedule for most plants.";
    }
  }

  function getLightAdvice() {
    if (!weather.value) return "";

    // This would be more accurate with actual cloud coverage data
    if (weather.value.description.includes("clear")) {
      return "Clear skies today. Great opportunity to give light-loving plants some direct sunshine, but protect sensitive plants from intense midday sun.";
    } else if (weather.value.description.includes("cloud")) {
      return "Cloudy day. Diffused light is gentler on plants - a good day to give full-sun plants a break, but move plants needing bright light closer to windows.";
    } else if (
      weather.value.description.includes("rain") ||
      weather.value.description.includes("drizzle")
    ) {
      return "Rainy day with lower light levels. No need to supplement with grow lights unless rain persists for multiple days.";
    } else {
      return "Check light levels today and adjust plant positions accordingly to ensure they get adequate light exposure.";
    }
  }

  function getTemperatureAdvice() {
    if (!weather.value) return "";

    const temp = weather.value.temperature;

    if (temp < 5) {
      return "Very cold outside. Keep tender plants away from cold windows and drafts. Be careful when transporting plants outdoors.";
    } else if (temp < 15) {
      return "Cool temperatures. Most houseplants will slow their growth. Reduce fertilization and watering frequency.";
    } else if (temp > 30) {
      return "Hot temperatures. Plants may need more frequent watering. Provide shade for sensitive plants and increase humidity for tropical varieties.";
    } else {
      return "Comfortable temperature range for most plants. Maintain regular care schedule.";
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  // Load data on component mount
  onMounted(() => {
    getWeather();
  });
</script>
