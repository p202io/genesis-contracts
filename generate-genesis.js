const { spawn } = require("child_process")
const program = require("commander")
const nunjucks = require("nunjucks")
const solc = require('solc')
const fs = require("fs")
const web3 = require("web3")

const validators = require("./validators")

// load and execute bor validator set
require("./generate-borvalidatorset")

program.version("0.0.1")
program.option("-c, --side-chain-id <side-chain-id>", "Side chain id", "15001")
program.option(
  "-o, --output <output-file>",
  "Genesis json file",
  "./genesis.json"
)
program.option(
  "-t, --template <template>",
  "Genesis template json",
  "./genesis-template.json"
)
program.parse(process.argv)

// compile contract
function compileContract(key, contractFile, contractName) {
  return new Promise((resolve, reject) => {
    const ls = spawn("solc", [
      "--bin-runtime",
      "openzeppelin-solidity/=node_modules/openzeppelin-solidity/",
      "solidity-rlp/=node_modules/solidity-rlp/",
      "/=/",
      // "--optimize",
      // "--optimize-runs",
      // "200",
      contractFile
    ])

    const result = []
    ls.stdout.on("data", data => {
      result.push(data.toString())
    })

    ls.stderr.on("data", data => {
      result.push(data.toString())
    })

    ls.on("close", code => {
      console.log(`child process exited with code ${code}`)
      const fn = code === 0 ? resolve : reject
      fn(result.join(""))
    })
  }).then(compiledData => {
    compiledData = compiledData.replace(
      new RegExp(`======= ${contractFile}:${contractName} =======\nBinary of the runtime part:` + '[ ]?'),
      "@@@@"
    )

    const matched = compiledData.match(/@@@@\n([a-f0-9]+)/)
    return { key, compiledData: matched[1], contractName, contractFile }
  })
}

// compile contract
function compileContract2(key, contractFile, contractName) {
  const input = {
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: {
        content: fs.readFileSync(contractFile, { encoding: 'utf8' }),
      }
    },
    settings: {
      optimizer: { enabled: true, runs: 200, },
      evmVersion: 'constantinople',
      outputSelection: { '*': { '*': ['*'], }, },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const bytecode = output.contracts[`${contractName}.sol`][contractName].evm.deployedBytecode.object;
  return { key, compiledData: bytecode, contractName, contractFile }
}

// compile files
Promise.all([
  compileContract2(
    "borValidatorSetContract",
    "flatten/BorValidatorSet.sol",
    "BorValidatorSet"
  ),
  compileContract2(
    "borStateReceiverContract",
    "flatten/StateReceiver.sol",
    "StateReceiver"
  ),
  compileContract2(
    "maticChildERC20Contract",
    "p202-contracts/flatten/MRC20.sol",
    "MRC20"
  )
]).then(result => {
  const totalMaticSupply = web3.utils.toBN("500000000")

  var validatorsBalance = web3.utils.toBN(0)
  validators.forEach(v => {
    validatorsBalance = validatorsBalance.add(web3.utils.toBN(v.balance))
    v.balance = web3.utils.toHex(web3.utils.toWei(String(v.balance)))
  })

  const contractBalance = totalMaticSupply.sub(validatorsBalance)
  const data = {
    chainId: program.sideChainId,
    validators: validators,
    maticChildERC20ContractBalance: web3.utils.toHex(
      web3.utils.toWei(contractBalance.toString())
    )
  }

  result.forEach(r => {
    data[r.key] = r.compiledData
  })

  const templateString = fs.readFileSync(program.template).toString()
  const resultString = nunjucks.renderString(templateString, data)
  fs.writeFileSync(program.output, resultString)
}).catch(err => {
  console.log(err)
  process.exit(1)
})
