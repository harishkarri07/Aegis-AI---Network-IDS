/** @type {import('tailwindcss').Config} */
// Aegis UI tokens — single source mapped from DESIGN.md / FINAL_AEGIS_UI_BLUEPRINT.md.
// Naming intent: `bg-surface-1`, `border-hairline`, `text-primary`, `bg-critical-soft`, etc.
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas + surface ladder (never pure black)
        canvas: '#0c0e12',
        'canvas-deep': '#08090c',
        'surface-1': '#13161c',
        'surface-2': '#181c24',
        'surface-3': '#1e232d',
        // Hairlines
        hairline: '#232733',
        'hairline-strong': '#2d3340',
        'hairline-faint': 'rgba(255,255,255,0.05)',
        // Text
        primary: '#eceef2',
        secondary: '#c3c8d1',
        muted: '#98a0ad',
        faint: '#6b7280',
        // Single interactive accent
        accent: '#5f6ae0',
        'accent-hover': '#7e89ea',
        'accent-pressed': '#4853bd',
        'accent-soft': 'rgba(95,106,224,0.14)',
        // Semantic data colors + soft fills (severity = data, never chrome)
        critical: '#e5484d',
        'critical-soft': 'rgba(229,72,77,0.12)',
        warning: '#e3963a',
        'warning-soft': 'rgba(227,150,58,0.12)',
        medium: '#d9a13b',
        'medium-soft': 'rgba(217,161,59,0.12)',
        success: '#3fb68a',
        'success-soft': 'rgba(63,182,138,0.12)',
        info: '#6db3e6',
        'info-soft': 'rgba(109,179,230,0.12)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      fontSize: {
        display: ['24px', { lineHeight: '1.3', letterSpacing: '-0.4px' }],
        title: ['20px', { lineHeight: '1.3', letterSpacing: '-0.3px' }],
        subtitle: ['16px', { lineHeight: '1.4', letterSpacing: '-0.2px' }],
        body: ['14px', { lineHeight: '1.55', letterSpacing: '0' }],
        caption: ['13px', { lineHeight: '1.5', letterSpacing: '0' }],
        micro: ['12px', { lineHeight: '1.45', letterSpacing: '0' }],
      },
      borderRadius: {
        well: '6px',
        control: '8px',
        card: '10px',
        panel: '12px',
        chip: '9999px',
      },
      boxShadow: {
        dialog: '0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
