#!/usr/bin/env sh

# Usage: 
# generate.sh 15001 heimdall-15001

set -x #echo on
set -e
set -o pipefail

if [ -z "$1" ]
  then
    echo "Bor chain id is required first argument"
  exit 1
fi

if [ -z "$2" ]
  then
    echo "Heimdall chain id is required as second argument"
  exit 1
fi

npm install
npm run truffle:compile
git submodule init
git submodule update
cd p202-contracts
npm install
node scripts/process-templates.js --side-chain-id $1
npm run truffle:compile
npm run flatten
cd ..
node generate-borvalidatorset.js --side-chain-id $1 --validator-chain-id $2
npm run truffle:compile
npm run flatten
node generate-genesis.js --side-chain-id $1 --validator-chain-id $2
