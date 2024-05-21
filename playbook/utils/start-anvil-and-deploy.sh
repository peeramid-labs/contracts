#! /bin/bash

rm -rf ./deployments/localhost
export NODE_ENV=TEST
anvil
pnpm hardhat deploy --tags multipass  --network localhost'