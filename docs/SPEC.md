# VRC Dashboard — Application Specification

## Purpose

A lightweight VRChat companion app for monitoring friends' online status, locations, and activity. Similar to VRCX or VRC Friend Connect, but without any tracking or history. Runs natively on Windows, Linux, macOS, and Android.

The core value is seeing who is online and where they are — with more detail than the VRChat website, and without the clutter of other tools.

---

## Authentication

Users authenticate by providing their VRChat `auth` cookie value (an `authcookie_xxx` token). The token is obtained manually from `vrchat.com/api/1/auth`.

- On login, the token is validated by fetching the current user's profile from the VRChat API.
- The token is persisted so sessions survive app restarts.
- On startup, the saved token is restored automatically. If expired or invalid, it is cleared and the user is returned to the login screen.
- Logout clears the stored token and all in-memory session state.

The login screen displays step-by-step instructions for obtaining the token from VRChat's website.

---

## Navigation

The app has four tabs accessible from the top bar:

| Tab | Purpose |
|---|---|
| Friends | See who is online and where |
| Worlds | Search and browse public worlds |
| Recent | View recently visited instances |
| Prints | View in-world photos |

The top bar also contains:
- **Notifications bell** — opens a dropdown listing friend requests, invites, and other notifications. Supports refresh, individual delete, and clear-all.
- **User avatar** — opens the current user's profile dialog with settings and logout.
- **Window controls** (desktop only) — minimize, maximize, close.

---

## Friends Page (Primary View)

The friends page shows all the user's friends organized into three areas, refreshed automatically on mount, window focus, and visibility change (with a 30-second cooldown between automatic refreshes). A manual refresh button bypasses the cooldown.

### Main Area — Instance Groups

Online friends who are in a joinable instance are grouped by the instance they are in. Each group is displayed as a horizontal card (preview on left, friend list on right):

**Left preview area** shows:
- World thumbnail image (clickable to open the World Dialog)
- World name
- Visibility type (Public, Friends, Friends+, Invite, Invite+, Group, Group+)
- User count vs. capacity
- Instance owner name (with crown icon)
- Supported platforms (Windows, Android, iOS, Web) shown in a badge
- **Invite myself** button (envelope icon) — sends a self-invite to that instance

**Right friend list** shows all friends in that instance, each with avatar, display name, status description, and platform icon.

Additionally, friends whose location is `"traveling"` are grouped into a **Traveling** card at the top of the grid, showing just the airplane icon and friend list (no world preview).

### Sidebar — Two Columns

On the right side of the page:

**Private friends** — friends whose location is private, hidden, offline, or empty. Sorted by status priority (Join Me > Active > Ask Me > Busy). A toggle button on hover shows or hides friend names (icon-only mode when hidden).

**Offline friends** — friends who are offline. Sorted by last activity (most recent first). Displayed in grayscale. Same name toggle behavior.

### Search

Filters all areas (instance groups, private friends, offline friends) by display name or world name. Live filtering as the user types.

### Online Count

Displays `online/total` friend count. Clicking shows a popover with a breakdown: online, active, and offline counts.

---

## Worlds Page

Browse and search public VRChat worlds by tags (not free-text). Worlds are listed in a responsive grid.

### Tag Search

Users type tags and press Enter to add them. Tags are prefixed with `author_tag_` automatically. Pressing Backspace on an empty input removes the last tag. A predefined tags dropdown offers "Labs" (`system_labs`) and "Game" (`author_tag_game`) with toggle checkboxes.

### Sorting

Sortable by: popularity, favorites, random, shuffle, trust, magic, created, heat. Toggle between ascending and descending order. A sort-change button updates results immediately.

### Favorites Filter

Users can filter the world list to show only worlds they've saved in a specific favorite group. A dropdown lists all groups plus an "All worlds" option. Favorite group management happens inside the World Dialog.

### Pagination

Results load 20 at a time. A "Load more" button at the bottom fetches the next page. The total world count is displayed.

### World Card

Each world is a compact card showing thumbnail, name, author, favorites count, current occupants (if any), and supported platform icons.

---

## Recent Page

Lists instances the user has recently visited, fetched from the VRChat API. Each instance is displayed as a card with:

- World thumbnail
- World name
- Visibility type, region, user count vs. capacity
- Owner name
- Supported platforms

Clicking a card opens the World Dialog. A refresh button and instance count are shown in the header.

---

## Prints Page

Displays the current user's in-world photos ("prints") in a responsive grid. Each print card shows:

- Photo thumbnail (clickable for lightbox view)
- World name, author name, timestamp
- Optional note text
- Clickable pills to open the author's profile page or world page on vrchat.com

The lightbox view shows the full image with metadata (world name, author, timestamp, note). Close with Escape key or clicking outside.

---

## World Dialog

A modal dialog providing detailed world information and actions. Opened from Friends, Worlds, or Recent pages.

**Hero section** — large background image (clickable to open the world on vrchat.com) with:
- World name, author, publication date, public instance count
- Supported platforms with labels

**Action buttons** (top-right overlay):
- **Copy world ID** to clipboard
- **Favorite star** — opens a dropdown panel showing all favorite groups. Toggle world membership in any group. Create new groups inline.
- **Create instance** — opens a panel with region selector (US West, US East, Europe, Japan) and type selector (Friends, Friends+, Invite, Invite+, Public). Non-public instances require the current user as owner. Creates the instance and opens it in the dialog.
- **Invite myself** (when opened from an instance context) — sends a self-invite to the current instance.

**Details section** — when opened from an instance context, shows: owner, user count, visibility type. Below that: world description, tags (with `author_tag_` prefix stripped for display).

---

## User Profile Dialog

A modal dialog showing a user's profile. Opened by clicking any friend's name or avatar throughout the app.

**Header**:
- Avatar image (clickable to open VRChat profile page in browser)
- Display name, pronouns, status description
- Trust level with color coding: Visitor (gray), New User (green), User (blue), Known (orange), Trusted (purple)

**Sections**:
- Bio text
- Stats: online friends count, total friends count, join date, last active (relative time via `date-fns`)
- Showcased badges
- Mutual friends (clickable thumbnails to navigate between profiles)
- **Invite button** — sends an invite to the current user's instance (only when the current user is in a joinable, non-offline instance)

**Current user extras** (when opened from the top bar avatar):
- **Interface Scale** slider (desktop only) — manual override from 90% to 125%, combined with auto-detected DPI scale. Persisted in localStorage. Shows override %, auto %, and effective %.
- **Sign Out** button

---

## Notifications

Opened from the bell icon in the top bar. Displays the 40 most recent notifications of all types in a scrollable list.

Each notification shows: sender username, timestamp, message (or a fallback based on type), parsed details, and notification type. Each has a "Delete" button that hides it via the API.

Header actions: "Refetch" to reload from the API, "Clear all" to hide all notifications.

---

## UI Scaling

Two-layer scaling system applied via CSS:

1. **Auto scale** (100%–150%): Based on device pixel ratio and screen resolution relative to a 1920×1080 baseline. Recalculated on window resize and DPR changes.
2. **User scale** (90%–125%): Manual override adjustable via the user profile dialog (desktop only). Persisted in localStorage.

Effective scale = auto scale × user scale, capped appropriately.

---

## Refresh Behavior

| Page | Triggers |
|---|---|
| Friends | Mount, window focus, visibility change. 30s cooldown. Manual bypasses cooldown. |
| Worlds | Mount, tab change. Tag/sort/order changes debounced 300ms. |
| Recent | Mount, tab change. |
| Prints | Mount, window focus, visibility change. |
| Notifications | On-demand when dropdown opens. Manual refetch available. |

---

## Platform Detection

The app detects the environment at startup:
- **Desktop**: Tauri native window with custom window controls and drag region
- **Android**: Notched-device safe areas, no window controls, touch-friendly layout

On Linux, a GPU compatibility workaround is applied during webview initialization.

---

## Instance ID Format

VRChat location strings follow `worldId:instancePart`. The instance part encodes via URL-like segments:

- **Visibility**: `public`, `~friends(ownerId)`, `~hidden(ownerId)`, `~private(ownerId)`, `~private(ownerId)~canRequestInvite`, `~group(groupId)~groupAccessType(public)`, `~group(groupId)~groupAccessType(plus)`
- **Region**: `~region(us|use|eu|jp)` — defaults to `us`
- **Owner ID**: Extracted from the visibility-specific segment; `grp_` prefix indicates a group owner

---

## Favorite Groups

Users can organize worlds into named favorite groups, stored entirely in the browser's local storage (no server-side persistence). Groups have a name and a list of world IDs. Manage groups from the World Dialog: create new groups, delete groups, and toggle world membership. Filter worlds by group on the Worlds Page.
