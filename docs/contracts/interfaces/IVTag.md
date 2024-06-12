
# 
### public struct Tag

The struct describing the tag of a version obtained by a release and build number as `RELEASE.BUILD`.

| Input | Type | Description |
|:----- | ---- | ----------- |

*Releases mark incompatible changes (e.g., the plugin interface, storage layout, or incompatible behavior) whereas builds mark compatible changes (e.g., patches and compatible feature additions).*

```solidity
struct Tag {
  uint8 release;
  uint16 build;
}
```

# 
### public struct Version

The struct describing a plugin version (release and build).

| Input | Type | Description |
|:----- | ---- | ----------- |

```solidity
struct Version {
  struct Tag tag;
  address source;
  bytes buildMetadata;
}
```

# 
###  enum VersionRequirementTypes

*Enum defining the types of version requirements for repositories.
- All: Matches any version.
- MajorVersion: Matches any version with the same major version number.
- ExactVersion: Matches the exact version specified.*

```solidity
enum VersionRequirementTypes {
  All,
  MajorVersion,
  ExactVersion
}
```

# 
### public struct VersionControl

| Input | Type | Description |
|:----- | ---- | ----------- |

*Struct defining a version requirement for a repository.*

```solidity
struct VersionControl {
  address source;
  struct Tag baseVersion;
  enum VersionRequirementTypes requirementType;
}
```

# 
### public struct Envelope

| Input | Type | Description |
|:----- | ---- | ----------- |

*Struct defining the envelope for the installation of a new instance.*

```solidity
struct Envelope {
  address destination;
  bytes[] data;
}
```

