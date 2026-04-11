/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00d4ff',
        'neon-green': '#00ff88',
        'neon-red': '#ff3333',
        'neon-orange': '#ff8800',
        'neon-pink': '#ff44aa',
        'bg-primary': '#0a0e1a',
        'bg-card': '#0d1220',
        'bg-elevated': '#111827',
        'border-dim': '#1e3a5f',
        'text-dim': '#7090b0',
        'text-muted': '#4a6a8a',
      },
    },
  },
  plugins: [],
}
