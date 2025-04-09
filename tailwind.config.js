// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Override the entire theme's fontFamily to use Aujournuit by default
    fontFamily: {
      sans: ['Aujournuit'],
      serif: ['Aujournuit'],
      mono: ['SpaceMono'],
      // Add a base key to ensure it's applied everywhere
      base: ['Aujournuit'],
    },
    extend: {
      // Additional font configurations
      fontFamily: {
        // Ensure all text uses Aujournuit by default
        DEFAULT: ['Aujournuit'],
      },
    },
  },
  plugins: [],
};

