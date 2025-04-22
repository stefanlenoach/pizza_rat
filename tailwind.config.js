// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Override the entire theme's fontFamily to use Zodiak by default
    fontFamily: {
      sans: ['Zodiak'],
      serif: ['Zodiak'],
      mono: ['SpaceMono'],
      // Add a base key to ensure it's applied everywhere
      base: ['Zodiak'],
    },
    extend: {
      // Additional font configurations
      fontFamily: {
        // Ensure all text uses Zodiak by default
        DEFAULT: ['Zodiak'],
      },
    },
  },
  plugins: [],
};

