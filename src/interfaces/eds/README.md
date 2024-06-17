# Ethereum Distribution System

## Overview

The Ethereum Distribution System is a comprehensive solution for distributing Ethereum to users. It's designed with modularity and flexibility in mind, enabling various methods of Ethereum distribution. The system is user-friendly and integrates seamlessly with existing systems.

## Goal

Our goal is to facilitate users in installing diverse source code distributions for blockchain applications, with a focus on versioning. We aim to maintain a clear separation between the source code used, the versioning system it's added to, the dependency and entry point management, and the installation process of such contracts.

## Features

The Ethereum Distribution System now includes the following features:

- **Modular design**: Enables various methods of Ethereum distribution.
- **Loosely coupled**: Interfaces are designed to be unaware of their consumers, promoting flexibility.
- **Version controlled**: Facilitates easy upgrades and maintenance.
- **Easy to use**: A simple API and clear documentation make the system user-friendly.
- **New Feature 1**: (Describe the new feature here)
- **New Feature 2**: (Describe the new feature here)

## Interfaces

The Ethereum Distribution System now supports the following interfaces:

- [IVtag](./IVtag.md): Provides structures needed to create versions and manage version requirements.
- [IRepository](./IRepository.md): Provides the ability to store and retrieve source code in versioned manner.
- [IDistribution](./IDistribution.md): Provides the ability to package source code into distributions, where various sources are combined with rules of their instantiation
- [ISourceController](./ISourceController.md): Provides the ability to manage distribution and their versions permissions
- [IInstaller](./IInstaller.md): Provides the ability to install instances of distributions