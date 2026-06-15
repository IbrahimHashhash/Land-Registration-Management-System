# LRMIS Frontend (React)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and set the API URL.

3. Run the dev server:
   ```
   npm run dev
   ```

## Folder Map
```
src/
├── main.jsx          React entry point
├── App.jsx           Routing + layout
├── pages/            Top-level route pages
├── components/       Reusable UI components
├── hooks/            Custom React hooks
├── context/          Global state via React Context
├── services/         API client wrappers (axios/fetch)
├── utils/            Helpers, formatters, constants
├── assets/           Images and icons
└── styles/           Global CSS
```
