# React + Vite

## Run Gatherly locally

Run the API and frontend in separate terminals from the repository root:

```sh
cd backend
npm run dev
```

```sh
cd frontend
npm run dev
```

The backend development command watches `server.js` and restarts the API when its routes change. If an older API process is already using port 5000, stop it before starting the watched backend.

## AI-powered analytics PDF

The admin Analytics export uses Groq to generate a short written summary, highlights, and recommendations before creating the PDF. Configure `GROQ_API_KEY` in the repository-root `.env` file for local use and in the backend deployment's environment variables for production. `GROQ_MODEL` is optional; it defaults to `openai/gpt-oss-20b`.

Only aggregate chart buckets, totals, event statuses, and attendee discovery-source counts are sent to Groq; free-text discovery labels are anonymized. The API key must remain on the backend and must not be added to a `VITE_` variable.

Admin User Management and Events views can also export their currently filtered records as PDF, CSV, or Excel-compatible `.xls` tables. These exports do not call Groq; they include all matching records rather than only the current paginated rows.

Organizer Analytics can export its organizer-scoped charts as PDF or the chart data tables as CSV and Excel-compatible `.xls`. PDF export uses Groq for a final summary with highlights, risks, and recommended actions; CSV and Excel exports remain data-only. The AI request includes aggregate metrics and anonymized event/source labels, follows the selected event scope and analytics periods, and uses the backend-only `GROQ_API_KEY`.

Organizer Events, Orders, and Attendees pages can export their matching records as PDF, CSV, or Excel-compatible `.xls` without AI. Events exports include all records matching the current search, status, and archive filters; Orders and Attendees exports follow the selected event tab.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
