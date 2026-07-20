import type { Config } from "tailwindcss";

// Full brand token set lands in Batch 2. This keeps Tailwind building in Batch 1.
const config: Config = {
  content: ["./app/**/*.{ts,tsx,mdx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
