# VRC Dashboard — Application Specification

## Purpose

A lightweight VRChat companion app for monitoring friends' online status, locations, and activity. Similar to VRCX or VRC Friend Connect, but without tracking or history. Runs as a native desktop application (Windows, Linux, macOS) and on Android.

## Authentication

Users provide their VRChat `authcookie` value manually. The token is extracted from the browser by visiting `vrchat.com/api/1/auth` and copying the `auth` cookie.

- On login, the token is validated by fetching the current user profile from the VRChat API.
- The token is persisted locally via Tauri's store plugin so sessions survive restarts.
- On startup, the saved token is restored automatically. If it is expired or invalid (401), it is cleared and the user is returned to the login screen.
- Logout clears the stored token and all in-memory session state.

## Navigation

The app has four tabs accessible from the top bar:

| Tab | Purpose |
|---|---|
| Friends | See who is online and where |
| Worlds | Search and browse public worlds |
| Recent | View recently visited instances |
| Prints | View in-world photos (prints) |

The top bar also contains:
- **Notifications bell** — opens a dropdown with friend requests, invites, and other notifications. Supports refresh, individual delete, and clear-all.
- **User avatar** — opens the user menu dialog (profile, settings, logout).
- **Window controls** (desktop only) — minimize, maximize, close.

## Friends Page

The primary view. Shows all friends organized into three areas:

### Main Area — Instance Groups
Online friends who are in a joinable instance are grouped by the world instance they are in. Each group is displayed as an **Instance Card** showing:
- World thumbnail, name, visibility type, user count vs. capacity
- Instance owner name (with crown icon)
- Supported platforms (Windows, Android, iOS, Web)
- List of friends in that instance

Actions on instance cards:
- **Click world thumbnail** — opens the World Dialog for that world
- **Invite myself** (envelope icon) — sends a self-invite to that instance
- **Click friend name** — opens the User Profile Dialog

### Sidebar — Private and Offline Friends
Two columns on the right side:
- **Private friends** — friends whose location is private, hidden, or offline. Sorted by status priority (Join Me > Active > Ask Me > Busy). Can toggle name visibility.
- **Offline friends** — friends who are offline. Sorted by last activity (most recent first). Displayed in grayscale. Can toggle name visibility.

### Search
Filters instance groups, private friends, and offline friends by name or world name.

### Online Count
Displays `online/total` count. Clicking shows a popover with online, active, and offline breakdowns.

### Refresh
Manual refresh button plus automatic refresh on window focus and visibility change (30-second cooldown).

## Worlds Page

Search and browse public VRChat worlds.

### Tag-Based Search
Worlds are searched by tags (not free text). Users type tags and press Enter to add them. Tags are prefixed with `author_tag_` automatically. Predefined tags available via dropdown: "Labs" (`system_labs`) and "Game" (`author_tag_game`).

### Sorting
Sortable by: popularity, favorites, random, shuffle, trust, magic, created, heat. Toggle ascending/descending.

### Favorites Filter
Users can create named favorite groups and add worlds to them. When a favorite group is selected, only worlds in that group are displayed (fetched individually by ID).

Favorite groups are stored in `localStorage` under the key `vrc-dashboard-favorites`.

### Pagination
Results load 20 at a time with a "Load more" button.

### World Card
Each world shows its thumbnail, name, author, and stats. Clicking opens the World Dialog.

## World Dialog

Detailed view of a world, opened from Friends, Worlds, or Recent pages. Shows:
- Hero image with world name, author, publication date, public instance count
- Supported platforms with labels
- Instance details (if opened from an instance context): owner, user count, visibility type
- World description and tags

### Actions
- **Copy world ID** to clipboard
- **Favorite** — toggle world in favorite groups; create new groups inline
- **Create instance** — choose region (US West, US East, Europe, Japan) and type (Friends, Friends+, Invite, Invite+, Public). Non-public instances require the current user as owner.
- **Invite myself** — send self-invite to the current instance (when opened from an instance context)
- **Open on VRChat** — click the hero image to open the world page on vrchat.com

## Recent Page

Shows instances the user has recently visited. Each instance is displayed as a card with world info, visibility, region, user count, and owner name. Clicking opens the World Dialog.

Data is fetched from the VRChat API's recent instances endpoint. Owner names are resolved from cache or fetched on demand (user profiles or group profiles for `grp_` prefixed IDs).

## Prints Page

Displays the user's VRChat prints (in-world photos) in a grid. Each print shows:
- Image thumbnail (clickable for lightbox view)
- World name, author name, timestamp
- Optional note text
- Clickable pills to open the author's profile or world page on vrchat.com

The lightbox shows the full image with metadata. Close with Escape key or clicking outside.

## User Profile Dialog

Opened by clicking any friend's name or avatar. Shows:
- Avatar image (clickable to open VRChat profile page)
- Display name, pronouns, status description
- Trust level with color coding: Visitor (gray), New User (green), User (blue), Known (orange), Trusted (purple)
- Bio text
- Stats: online friends count, total friends count, join date, last active (relative time)
- Showcased badges
- Mutual friends (clickable to navigate between profiles)
- **Invite** button — sends an invite to the current user's instance (only when the current user is in a joinable instance)

When opened as the current user's own menu (from top bar avatar), it also shows:
- **Interface Scale** slider (desktop only) — manual override from 90% to 125%, combined with auto-detected DPI scale. Persisted in `localStorage`.
- **Sign Out** button

## Instance ID Parsing

VRChat location strings follow the format `worldId:instancePart`. The instance part encodes:
- **Visibility**: public, friends, friends+ (hidden), invite, invite+ (private+canRequestInvite), group, group+
- **Region**: us, use, eu, jp
- **Owner ID**: extracted from the visibility-specific segment (e.g., `~friends(userId)`, `~group(groupId)`)

Owner IDs prefixed with `grp_` are resolved as group profiles; otherwise as user profiles.

## Refresh Behavior

- **Friends page**: Refreshed on mount, window focus, and visibility change. 30-second cooldown between automatic refreshes. Manual refresh bypasses cooldown.
- **Worlds page**: Refreshed on mount and tab change. Tag/sort/order changes trigger a debounced reload (300ms).
- **Recent page**: Refreshed on mount and tab change.
- **Prints page**: Refreshed on mount, window focus, and visibility change.
- **Notifications**: Loaded on demand when the dropdown is opened. Manual refetch available.

## Platform Support

- **Desktop** (Windows, Linux, macOS): Full window controls, custom titlebar with drag region, DPI-aware auto-scaling.
- **Android**: Safe area insets for notch/navigation bar, no window controls, touch-optimized layout.
- Linux sets `WEBKIT_DISABLE_DMABUF_RENDERER=1` before webview initialization for GPU compatibility.

## UI Scaling

Two-layer scaling system:
1. **Auto scale** (100%-150%): Based on device pixel ratio and screen resolution relative to a 1920x1080 baseline. Recalculated on window resize and DPR changes.
2. **User scale** (90%-125%): Manual override persisted in `localStorage`. Adjustable via slider in the user menu.

Effective scale = auto scale x user scale. Applied as a CSS custom property `--ui-scale`.
