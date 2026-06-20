/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  passWithNoTests: true,
  testMatch: ["<rootDir>/services/**/*.test.ts", "<rootDir>/services/**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
