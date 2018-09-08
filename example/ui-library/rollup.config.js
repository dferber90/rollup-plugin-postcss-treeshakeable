import babel from "rollup-plugin-babel";
import postcss from "rollup-plugin-postcss";
import cleaner from "rollup-plugin-cleaner";
import postcssTreeshakeable from "rollup-plugin-postcss-treeshakeable";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs"
    },
    {
      file: "dist/index.esm.js",
      format: "esm"
    }
  ],
  plugins: [
    cleaner({
      targets: ["./dist/"],
      silent: true
    }),
    babel({
      exclude: "node_modules/**" // only transpile our source code
    }),
    postcss({
      modules: true,
      plugins: []
    }),
    postcssTreeshakeable(),
  ],
  external: ["react", "react-dom"]
};
