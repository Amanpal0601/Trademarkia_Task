/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        jsx: "react-jsx",
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "services/**/*.ts",
    "store/**/*.ts",
    "components/shared/**/*.tsx",
    "components/dashboard/**/*.tsx",
    "!lib/firebase.ts",
    "!**/*.d.ts",
  ],
};

module.exports = config;
