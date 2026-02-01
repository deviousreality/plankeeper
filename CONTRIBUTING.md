# 🌱 Contributing to PlantKeeper

Thank you for considering contributing to PlantKeeper! This document provides guidelines and instructions to help you get started.

## 🔑 Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive of diverse perspectives
- Give and gracefully accept constructive feedback
- Focus on what is best for the community and users
- Show empathy towards other community members

## 🚀 Development Setup

1. **Fork the repository** by clicking the "Fork" button at the top right of the repository page

2. **Clone your fork**:

   ```bash
   git clone https://github.com/your-username/plantkeeper.git
   cd plantkeeper
   ```

3. **Set up the upstream remote**:

   ```bash
   git remote add upstream https://github.com/original-owner/plantkeeper.git
   ```

4. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

5. **Create a `.env` file** with required environment variables (see `.env.example`)

6. **Initialize the database**:

   ```bash
   npm run reset-db
   # or
   yarn reset-db
   ```

7. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 💻 Development Workflow

1. **Create a new branch** for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-you-are-fixing
   ```

2. **Make your changes** following the code style guidelines

3. **Commit your changes** with clear, descriptive commit messages:

   ```bash
   git commit -m "feat: add plant growth tracking feature"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

4. **Stay updated** with the main repository:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

5. **Push your changes** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Submit a pull request** through GitHub

## 📋 Pull Request Guidelines

- Fill in the required template
- Include screenshots or GIFs for UI changes
- Update documentation if needed
- Add comments for complex code
- Make sure all tests pass
- Request review from maintainers

## 🧪 Testing Guidelines

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Test on both light and dark themes
- Test responsive behavior on different screen sizes

## 📚 Documentation Guidelines

- Update README.md if you add new features or change existing ones
- Add JSDoc comments to functions and classes
- Comment complex logic or algorithms
- Keep comments up-to-date with code changes

## ✨ Feature Ideas

Here are some ideas for future improvements:

- 📱 Plant image upload functionality
- 📊 Plant growth tracking and visualization
- 💬 Community forum for plant care discussions
- 🔍 Integration with plant identification APIs
- 📅 Calendar view for upcoming care tasks
- 📲 Progressive Web App (PWA) support
- 🌐 Internationalization support
- 🌧️ Enhanced weather integrations
- 📊 Data export/import functionality

## ❓ Questions?

If you have questions or need help, please open an issue or reach out to the maintainers.

Thank you for contributing to PlantKeeper! 🌿
