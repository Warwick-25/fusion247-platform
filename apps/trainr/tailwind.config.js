/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // scans app, components, etc.
    './src/**/*.{js,ts,jsx,tsx,mdx}', // scans src directory
  ],
  theme: { extend: {} },
  plugins: [],
};
