# Splitwise Clone

A modern web application for splitting expenses with friends, built with React, TypeScript, and Tailwind CSS.

## Features

- User authentication (login/register)
- Create and manage groups
- Add expenses with equal or weighted splits
- Track balances between group members
- Settle up debts
- Dark mode support
- Responsive design

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router DOM
- Zustand (State Management)
- Headless UI
- Heroicons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
/src
  /components      # Reusable UI components
  /pages          # Page components
  /store          # Zustand store
  /types          # TypeScript types
  /mock           # Mock API server
  App.tsx         # Main app component
  main.tsx        # Entry point
```

## Mock Data

The application uses a mock API server for development. You can find the mock data and API functions in `src/mock/server.ts`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request