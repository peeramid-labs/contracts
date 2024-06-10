// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IVInstaller} from "../interfaces/IVInstaller.sol";
import "@aragon/osx/core/plugin/Plugin.sol";

abstract contract IVInstallerPlugin is IVInstaller, Plugin {}
