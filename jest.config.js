module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(test).ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
}
