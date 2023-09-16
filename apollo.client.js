module.exports = {
  client: {
    includes: ["app/**/*.{ts,tsx,js,jsx,graphql}"],
    service: {
      name: `galoy`,
      url: `https://api.staging.galoy.io/graphql`,
    },
  },
}
