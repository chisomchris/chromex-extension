const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/scripts/contents.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "contents.js",
    path: path.resolve(__dirname, "dist", "scripts"),
  },
};
