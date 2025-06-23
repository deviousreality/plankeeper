// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['vuetify/styles'],
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    '@nuxtjs/color-mode'
  ],
  colorMode: {
    preference: 'system', // Default to system preference
    dataValue: 'theme',   // activate data-theme in <html> tag
    classSuffix: '',
  },
  app: {
    head: {
      title: 'PlantKeeper',
      meta: [
        { name: 'description', content: 'Keep track of your plants with PlantKeeper' }
      ],
    }
  },
  runtimeConfig: {
    public: {
      weatherApiKey: process.env.WEATHER_API_KEY || 'your-weather-api-key', // Use environment variable in production
    }
  }
})
