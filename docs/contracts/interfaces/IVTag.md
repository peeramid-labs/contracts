# Solidity API

## Tag

The struct describing the tag of a version obtained by a release and build number as `RELEASE.BUILD`.

_Releases mark incompatible changes (e.g., the plugin interface, storage layout, or incompatible behavior) whereas builds mark compatible changes (e.g., patches and compatible feature additions)._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Tag {
  uint8 release;
  uint16 build;
}
```

## Version

The struct describing a plugin version (release and build).

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Version {
  struct Tag tag;
  address source;
  bytes buildMetadata;
}
```

