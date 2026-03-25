# My Stack Knowledge

Trigger: whenever modifying any frontend component, Supabase query, routing logic, or animation.

## Stack
- React + Vite
- TailwindCSS — utility classes only, never write custom CSS or inline styles
- Framer Motion for animations — variants go in a separate variants.ts file
- Supabase for backend and auth
- Capacitor for mobile builds

## Rules for this stack
- Never modify Supabase client config unless explicitly asked
- All Supabase queries must handle loading and error states
- Never break mobile compatibility — always consider Capacitor
- Keep components small and single-responsibility
