# genesis-contracts

#### Setup genesis

Setup genesis whenever contracts get changed
### 1. Install dependencies and submodules
```bash
$ npm install
$ git submodule init
$ git submodule update
```

### 2. Compile Project202 contracts
```bash
$ cd p202-contracts
$ npm install
$ node scripts/process-templates.js --side-chain-id <side-chain-id>
$ npm run truffle:compile
$ cd ..
```

### 3. Generate Bor validator set sol file

Following command will generate `BorValidatorSet.sol` file from `BorValidatorSet.template` file.

```bash
# Generate bor validator set using stake and balance
# Modify validators.json before as per your need
$ node generate-borvalidatorset.js --side-chain-id <side-chain-id> --validator-chain-id <validator-chain-id>
```

### 4. Compile contracts
```bash
$ npm run truffle:compile
```

### 5. Generate genesis file

Following command will generate `genesis.json` file from `genesis-template.json` file.

```bash
# Generate genesis file
$ node generate-genesis.js --side-chain-id <side-chain-id> --validator-chain-id <validator-chain-id>
```

### 6. Run Tests
```bash
$ npm run testrpc
$ npm test
```
