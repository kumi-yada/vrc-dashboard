---
name: vrchat-api
description: VRChat domain knowledge — auth flow, API proxying, instance ID parsing. Use when working with the VRChat API
---

OpenAPI definition for the API defined in `Insomnia_VRC.yaml`

## Example Data

The `data` folder contains example JSON responses

## Instance ID

`wrld_5993198d-e869-414b-bf97-deb424bff63c:09605~hidden(usr_d35eff2e-3229-447b-94d4-7f24bb61fbd8)~region(jp)`

An instance ID contains various information about it.

### World ID

The instance ID starts with the world ID until the colon.

### Visibility

The visibility of the instance can be determined like this:
if it contains any of the below in the ID

- `~friends(` - It's friend only
- `~hidden(` - It's friend+
- `~private(` and `~canRequestInvite` - It's invite+
- `~private(` - It's invite only
- `~groupAccessType(public)` - It's group public
- `~groupAccessType(plus)` or `~group(` - It's group+
- if none of the above it's public

### Owner ID

In friend-only and friend+, you can get the user_id of the owner between the parenthesis of `~friends()` or `~hidden()`

In group public and group+, the group_id can be found between the parenthesis of `~group()`

Public instances don't have owners

### Region

Region can be parsed from the `~region()` part

## Authentication

We use a single token the user have to get from the VRChat website and paste it into the application.
