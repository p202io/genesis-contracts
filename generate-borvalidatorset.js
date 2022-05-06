const program = require("commander")
const fs = require("fs")
const nunjucks = require("nunjucks")
const web3 = require("web3")
const validators = require("./validators")

program.version("0.0.1")
program.option("--side-chain-id <side-chain-id>", "Side chain id", "15001")
program.option(
  "--validator-chain-id <validator-chain-id>",
  "Validator chain id",
  "heimdall-P5rXwg"
)
program.option(
  "--first-end-block <first-end-block>",
  "End block for first span",
  "255"
)
program.option(
  "-o, --output <output-file>",
  "BorValidatorSet.sol",
  "./contracts/BorValidatorSet.sol"
)
program.option(
  "-t, --template <template>",
  "BorValidatorSet template file",
  "./contracts/BorValidatorSet.template"
)
program.parse(process.argv)

// process validators
validators.forEach(v => {
  v.address = web3.utils.toChecksumAddress(v.address)
})

const data = {
  borChainId: program.sideChainId,
  heimdallChainId: program.validatorChainId,
  firstEndBlock: program.firstEndBlock,
  validators: validators
}
const templateString = fs.readFileSync(program.template).toString()
const resultString = nunjucks.renderString(templateString, data)
fs.writeFileSync(program.output, resultString)
console.log("Side chain validator set file updated.")
