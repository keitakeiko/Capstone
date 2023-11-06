const countryCodes = require('country-codes-list')
const countryCodesMap = countryCodes.customList("countryNameEn", "{countryCode}");


module.exports = {
  ifCond: (a, b, options) => {
    return a === b ? options.fn(this) : options.inverse(this)
  },
  getAbbreviationCountry: NATION => {
    const lowercaseNation = NATION.toLowerCase()
    const Nation = lowercaseNation[0].toUpperCase() + lowercaseNation.substring(1)
    return countryCodesMap[Nation]
  }
}

