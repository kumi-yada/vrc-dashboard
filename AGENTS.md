## Frameworks

- Tauri Desktop Application using Svelte
- Iconify for the icons

## LLMS

Get infos about the various tools and frameworks at

- [tauri.txt](./.github/llms/tauri.txt)
- [svelte.txt](./.github/llms/svelte.txt)

## Example Data

- /auth/user - Get the info of the current user [me.json](./data/me.json)
- /users/usr_** - Get the info of a user [user.json](./data/user.json)
- /instances/wrld_**:** - Get the info of a instance [user.json](./data/instance.json)

## Instance ID

`wrld_5993198d-e869-414b-bf97-deb424bff63c:09605~hidden(usr_d35eff2e-3229-447b-94d4-7f24bb61fbd8)~region(jp)`

A instance ID contains various information about it.

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