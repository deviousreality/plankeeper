# PlantKeeper

A web application for keeping track of plants, their care schedules, and providing care tips based on weather conditions. Built with Nuxt 3, Vue 3, Vuetify, and SQLite.

## Features

- **Plant Inventory Management**: Keep track of all your plants with details like species, acquisition date, and care requirements
- **Care Schedule Tracking**: Set watering and fertilizing intervals and get reminders for upcoming tasks
- **Care History**: Record plant care activities with notes and timestamps
- **Plant Care Tips**: Browse species-specific care tips or add your own
- **Weather Integration**: Get current weather and forecasts with plant care recommendations based on conditions
- **Multi-User Support**: Supports multiple user accounts with secure authentication
- **Responsive UI**: Works on desktop and mobile devices with light/dark theme support

## Technologies Used

- **Frontend**: Nuxt 3, Vue 3, Vuetify 3, Vite
- **Database**: SQLite (via better-sqlite3)
- **Weather API**: OpenWeatherMap API
- **Authentication**: Username/password local authentication

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenWeatherMap API key (free tier works fine)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root with your OpenWeatherMap API key:
   ```
   WEATHER_API_KEY=your_api_key_here
   ```
4. Initialize the database with sample data:
   ```bash
   npm run reset-db
   ```
   
   This will create:
   - A sample admin user (username: `admin`, password: `password123`)
   - Plant care tips for common houseplants

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`
3. Log in with the sample admin account or register a new user

### VS Code Tasks

This project includes VS Code tasks to make development easier:

- **Start Development Server**: Runs the Nuxt development server
- **Reset Database**: Initializes the SQLite database with schema and sample data
- **Build for Production**: Creates a production build
- **Start Preview Server**: Runs the production build locally

To use these tasks in VS Code, press `Ctrl+Shift+P` and select "Tasks: Run Task", then choose the task you want to run.

### Production

1. Build for production:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run preview
   ```

## Project Structure

- `/server/utils/db.ts`: Database initialization and schema
- `/server/api/`: API endpoints for plants, authentication, care tips, and weather
- `/pages/`: Vue pages for the application
- `/layouts/`: Application layouts
- `/composables/`: Reusable Vue composables like authentication
- `/plugins/`: Vuetify and other plugin configurations
- `/public/`: Static assets

## License

MIT

## Acknowledgements

- Vuetify for UI components
- OpenWeatherMap for weather data
- better-sqlite3 for database functionality
