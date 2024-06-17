#! /bin/bash

rm -rf ./deployments/localhost
export NODE_ENV=TEST
pnpm hardhat deploy --tags multipass,rankify --network localhost
