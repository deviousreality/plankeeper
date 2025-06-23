# Contributing to PlantKeeper

We welcome contributions to the PlantKeeper project! Here's how you can help:

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/plankeeper.git
   cd plankeeper
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with your OpenWeatherMap API key
5. Initialize the database:
   ```bash
   npm run reset-db
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/server/utils/db.ts`: Database initialization and schema
- `/server/api/`: API endpoints for plants, authentication, care tips, and weather
- `/pages/`: Vue pages for the application
- `/layouts/`: Application layouts (default and auth)
- `/composables/`: Reusable Vue composables like authentication
- `/plugins/`: Vuetify and other plugin configurations
- `/public/`: Static assets

## Adding New Features

When adding new features, please:

1. Follow the existing code style and patterns
2. Add comments for any complex logic
3. Update the database schema in `server/utils/db.ts` if needed
4. Update tests if applicable

## Pull Request Process

1. Create a new branch for your feature
2. Make your changes
3. Test your changes thoroughly
4. Submit a pull request with a clear description of the changes

## Feature Ideas

Here are some ideas for future improvements:

- Plant image upload functionality
- Plant growth tracking
- Community forum for plant care discussions
- Integration with plant identification APIs
- Calendar view for upcoming care tasks
- Mobile app version

Thank you for contributing to PlantKeeper!
