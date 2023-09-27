const countryCodes = require('country-codes-list')
const countryCodesMap = countryCodes.customList("countryNameEn", "{countryCode}");
// console.log(countryCodesMap) 得到 { 國名 : 縮寫 }

module.exports = {
  ifCond: function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this)
  },
  getAbbreviationCountry: NATION => {
    const lowercaseNation = NATION.toLowerCase()
    const Nation = lowercaseNation[0].toUpperCase() + lowercaseNation.substring(1)
    return countryCodesMap[Nation]
  }
}

