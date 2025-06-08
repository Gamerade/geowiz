# GeoWiz - The Ultimate Capital, Flag & Outline Challenge

Test your geography knowledge with GeoWiz, an immersive trivia game featuring capitals, flags, country outlines, and fascinating cultural facts from around the world. Compete across unique game modes, unlock achievements, and track your progress as you become a true geography wizard!

![GeoWiz Logo](generated-icon.png)

## Features

- **5 Unique Game Modes:** Challenge yourself with mispronounced capitals, hidden country outlines, and more.
- **Visual Challenges:** Interactive questions with flags, maps, and cultural insights.
- **Region Selection:** Focus your quiz on specific continents or the whole world.
- **Ranks & Achievements:** Earn quirky nicknames, unlock badges, and discover fun facts as you play.
- **Learning Path:** Get personalized recommendations to improve your knowledge.
- **Progress Tracking:** View your score, accuracy, streaks, and recent achievements.
- **Modern UI:** Responsive, accessible, and visually engaging interface.

## Screenshots

> _Add screenshots from the `attached_assets/` folder or in-app to showcase gameplay and features._

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI, Framer Motion, Wouter
- **Backend:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL
- **AI Integration:** OpenAI API (for smart recommendations and trivia)
- **Authentication:** Passport, OpenID Connect (Replit OIDC supported)
- **State/Data:** React Query, custom hooks
- **Other:** PostCSS, esbuild, session management

## Project Structure

```
.
├── client/                # Frontend React app
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── components/    # UI and game components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utilities and data
│       └── pages/         # Main pages (home, landing, not-found)
├── server/                # Backend Express server
│   ├── db.ts              # Database connection (Drizzle ORM)
│   ├── index.ts           # Server entry point
│   ├── openai.ts          # OpenAI API integration
│   ├── learningRecommendations.ts # AI-powered learning path
│   ├── replitAuth.ts      # Replit OIDC authentication
│   └── routes.ts          # API routes
├── shared/                # Shared code/schema
│   └── schema.ts
├── attached_assets/       # Images and text assets
├── package.json           # Project metadata and scripts
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/geowiz.git
   cd geowiz
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL=postgres://user:password@host:port/dbname
   SESSION_SECRET=your-session-secret
   OPENAI_API_KEY=your-openai-api-key
   # For Replit OIDC (optional, if deploying on Replit):
   REPLIT_DOMAINS=your-replit-domains
   REPL_ID=your-replit-app-id
   ```

4. **Push database schema (if needed):**
   ```sh
   npm run db:push
   ```

### Running in Development

Start the server (serves both backend API and frontend):

```sh
npm run dev
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

### Building for Production

1. **Build the frontend and backend:**
   ```sh
   npm run build
   ```

2. **Start the production server:**
   ```sh
   npm start
   ```

## Usage

- Start your adventure, select a game mode and region, and test your knowledge!
- Track your stats, unlock achievements, and follow personalized learning paths.

## Contributing

Contributions are welcome! Please open issues or pull requests for new features, bug fixes, or suggestions.

## License

This project is licensed under the MIT License.

## Credits

- [OpenAI](https://openai.com/) for AI-powered trivia and recommendations
- [Unsplash](https://unsplash.com/) for imagery
- [Radix UI](https://www.radix-ui.com/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) for UI components

---
_Enjoy mastering world geography with GeoWiz!_
