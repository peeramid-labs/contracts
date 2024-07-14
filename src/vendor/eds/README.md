# Simple Distribution system


These interfaces form a simple, un versioned distribution system, that consists of two modules:

## 1. ISimpleDistribution

This interface is used to distribute a single source. Upon call it will create ProxyClone of specified sources and will return their address.

User may query the address of the sources or metadata

## 2. ISimpleDistributor

This interface is used to distribute multiple distributions with adding additional dynamic variables based instantiation logic on each distribution

Distributor (the owner of this contract) may list and de-list distribution sources, 
