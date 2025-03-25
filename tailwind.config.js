// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Override the entire theme's fontFamily to use ClashDisplay by default
    fontFamily: {
      sans: ['ClashDisplay'],
      serif: ['ClashDisplay'],
      mono: ['SpaceMono'],
      // Add a base key to ensure it's applied everywhere
      base: ['ClashDisplay'],
    },
    extend: {
      // Additional font configurations
      fontFamily: {
        // Ensure all text uses ClashDisplay by default
        DEFAULT: ['ClashDisplay'],
      },
    },
  },
  plugins: [],
};

