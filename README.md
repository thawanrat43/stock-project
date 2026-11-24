# Apex Stock Engine (repaired project)

## Requirements
- Node.js 20.19+ (recommended: Node.js 22 LTS)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (the configured port is 3000).

## Production build

```bash
npm run build
npm run preview
```

## Project layout

- `src/App.jsx` — application shell and inventory state
- `src/components/` — React UI components
- `src/data/` — sample inventory and user data
- `src/utils/` — stock and CSV helper functions
- `src/main.jsx` — browser entry point

## Important limitations

This source is currently a frontend demonstration. Inventory and user data are stored in the browser's `localStorage`. The login, OTP, password reset, and reset-OTP notification flows are not connected to a server or a real identity provider. The demo-access button is not authentication and must not be used as a security boundary. Before production use, connect a backend, implement server-side authentication/authorization, and persist data in a database.
