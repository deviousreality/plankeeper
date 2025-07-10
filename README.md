# 🪴 PlantKeeper

<div align="center">

![PlantKeeper Logo](public/images/default-plant.jpg)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3-00C58E.svg)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![Vuetify 3](https://img.shields.io/badge/Vuetify-3-1867C0.svg)](https://vuetifyjs.com/)

A web application for plant enthusiasts to track care schedules, record history, and get weather-based recommendations.

</div>

## ✨ Features

- **🌿 Plant Inventory Management**: Keep track of all your plants with details like species, acquisition date, and care requirements
- **📅 Care Schedule Tracking**: Set watering and fertilizing intervals and get reminders for upcoming tasks
- **📝 Care History**: Record plant care activities with notes and timestamps
- **💡 Plant Care Tips**: Browse species-specific care tips or add your own
- **🌤️ Weather Integration**: Get current weather and forecasts with plant care recommendations based on conditions
- **👥 Multi-User Support**: Supports multiple user accounts with secure authentication
- **📱 Responsive UI**: Works on desktop and mobile devices with light/dark theme support
- **⭐ Favorites**: Mark your favorite plants for quick access

## 🛠️ Technologies Used

- **Frontend**: [Nuxt 3](https://nuxt.com/), [Vue 3](https://vuejs.org/), [Vuetify 3](https://vuetifyjs.com/), [Vite](https://vitejs.dev/)
- **Database**: [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Weather API**: [OpenWeatherMap API](https://openweathermap.org/api)
- **Authentication**: Secure local authentication with [bcryptjs](https://github.com/dcodeIO/bcrypt.js/)
- **Type Safety**: Strict TypeScript type checking with no `any` types

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenWeatherMap API key (free tier works fine)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/plankeeper.git
   cd plankeeper
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the project root with your OpenWeatherMap API key:
   ```
   WEATHER_API_KEY=your_api_key_here
   ```

4. Initialize the database with sample data:
   ```bash
   npm run reset-db
   # or
   yarn reset-db
   ```
   
   This will create:
   - A sample admin user (username: `admin`, password: `password123`)
   - Plant care tips for common houseplants

### Database Management

Several scripts are available for database management:

```bash
# Reset database (creates fresh database with sample data)
npm run reset-db

# Run database migrations (updates schema to latest, includes automatic schema fixes)
npm run migrate-db

# Verify database schema integrity
npm run verify-db

# Update admin password
npm run update-admin-password
```

### Development

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser at `http://localhost:3000`

3. Log in with the sample admin account or register a new user

### Type Safety & Code Quality

This project uses strict TypeScript configuration:

```bash
# Run type checking
npm run typecheck

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

### Security Note

For production deployment, remember to:
- Update the admin password using `npm run update-admin-password`
- Use a secure, randomly generated JWT secret in your `.env` file

### VS Code Tasks

This project includes VS Code tasks to make development easier:

- **Start Development Server**: Runs the Nuxt development server
- **Reset Database**: Initializes the SQLite database with schema and sample data
- **Build for Production**: Creates a production build
- **Start Preview Server**: Runs the production build locally

To use these tasks in VS Code, press `Ctrl+Shift+P` and select "Tasks: Run Task", then choose the task you want to run.

### Production Deployment

1. Build for production:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:
   ```bash
   npm run preview
   # or
   yarn preview
   ```

3. For production deployment, consider using PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start .output/server/index.mjs
   ```

## 📂 Project Structure

```
plankeeper/
├── .vscode/              # VS Code configuration
├── composables/          # Vue composable functions
│   └── useAuth.ts        # Authentication composable
├── data/                 # SQLite database storage (created on first run)
├── layouts/              # Layout components
│   ├── auth.vue          # Layout for auth pages
│   └── default.vue       # Default page layout
├── middleware/           # Nuxt middleware
│   ├── auth.ts           # Authentication route guard
│   └── guest.ts          # Guest-only route guard
├── pages/                # Application pages
│   ├── care-tips.vue     # Care tips page
│   ├── index.vue         # Dashboard/home page
│   ├── login.vue         # Login page
│   ├── plants/           # Plant management pages
│   ├── register.vue      # Registration page
│   └── weather.vue       # Weather page
├── plugins/              # Plugin configurations
│   └── vuetify.ts        # Vuetify configuration
├── public/               # Public static assets
├── server/               # Server-side code
│   ├── api/              # API endpoints
│   ├── scripts/          # Utility scripts
│   └── utils/            # Server utilities 
│       └── db.ts         # Database utilities
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Example environment variables
├── app.vue               # Root application component
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT License
├── nuxt.config.ts        # Nuxt configuration
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- [Vuetify](https://vuetifyjs.com/) for UI components
- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for database functionality
- [Nuxt](https://nuxt.com/) for the Vue framework
- All the plant enthusiasts whose passion inspired this project
