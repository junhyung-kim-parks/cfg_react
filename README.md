1. merge package.json,vite.config.ts from root level to src
2. npm install
3. npm i -D @tailwindcss/postcss autoprefixer
4. rename postcss.config.cjs
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},  // Tailwind v4
    autoprefixer: {},
  },
};
5. move all files from src to root level
6. in Globals.css
Add
@import "../index.css";
@import "tailwindcss";
remove @import "tailwindcss"; in the middle
  # CFG_V3

  This is a code bundle for CFG_V3. The original project is available at https://www.figma.com/design/8zsB16WCGfBw8bHFcuB1YA/CFG_V3.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  