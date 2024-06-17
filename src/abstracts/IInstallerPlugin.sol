// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IInstantiator} from "../interfaces/eds/IInstantiator.sol";
import "@aragon/osx/core/plugin/Plugin.sol";

abstract contract IInstallerPlugin is IInstantiator, Plugin {}
