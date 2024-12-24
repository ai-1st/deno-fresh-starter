import { type Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: '#374151', // text-gray-700
            'ul > li::marker': {
              color: '#374151',
            },
            h1: {
              color: '#111827', // text-gray-900
            },
            h2: {
              color: '#111827',
            },
            h3: {
              color: '#111827',
            },
            strong: {
              color: '#111827',
            },
            a: {
              color: '#2563eb', // text-blue-600
              '&:hover': {
                color: '#1d4ed8', // text-blue-700
              },
            },
            code: {
              color: '#1f2937', // text-gray-800
              backgroundColor: '#f8fafc', // bg-slate-50
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
              '&::before': {
                content: '""',
              },
              '&::after': {
                content: '""',
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#f8fafc', // bg-slate-50
              padding: '1rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0', // border-slate-200
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                fontWeight: '400',
                color: '#1e293b', // text-slate-800
              },
            },
            'pre code': {
              fontSize: '0.875rem', // text-sm
              lineHeight: '1.5rem',
            },
          },
        },
      },
    },
  },
  daisyui: { 
    themes: [
      "cupcake",
      "dark",
      "dim",
    ],
  },
  plugins: [typography, daisyui as any],
} satisfies Config;
