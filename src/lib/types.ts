export interface Badge {
  badgeDescription: string;
  badgeId: string;
  badgeImageUrl: string;
  badgeName: string;
  showcased: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  currentAvatarImageUrl: string;
  currentAvatarThumbnailImageUrl: string;
  iconUrl: string;
  profilePicOverrideThumbnail: string;
  userIcon: string;
  status: string;
  statusDescription?: string;
  bio?: string;
  pronouns?: string;
  date_joined?: string;
  last_activity?: string;
  tags: string[];
  badges?: Badge[];
  friends?: string[];
  onlineFriends?: string[];
}

/** `GET /users/profile/{userId}` - holds the fields `GET /users/{userId}` dropped. */
export interface PublicProfile {
  id: string;
  displayName: string;
  bio?: string;
  bioLinks?: string[];
  pronouns?: string;
  status?: string;
  statusDescription?: string;
  currentAvatarImageUrl?: string;
  currentAvatarThumbnailImageUrl?: string;
  iconUrl?: string;
  userIcon?: string;
  badges?: Badge[];
  trustTags?: string[];
}

export interface Friend extends UserProfile {
  location: string;
  worldId: string;
  instanceId: string;
  state: string;
  platform?: string;
  last_platform: string;
  isFriend: boolean;
}

export interface WorldData {
  id: string;
  name: string;
  description: string;
  authorId?: string;
  authorName: string;
  capacity: number;
  recommendedCapacity: number;
  imageUrl: string;
  thumbnailImageUrl: string;
  favorites: number;
  visits: number;
  occupants?: number;
  publicOccupants?: number;
  privateOccupants?: number;
  heat?: number;
  popularity?: number;
  created_at?: string;
  publicationDate?: string;
  labsPublicationDate?: string;
  updated_at?: string;
  releaseStatus?: string;
  tags?: string[];
  slimInstances?: WorldSlimInstance[];
  unityPackages?: WorldUnityPackage[];
}

export interface WorldSlimInstance {
  instanceId: string;
  n_users: number;
  languageRatio?: Record<string, number>;
}

export interface WorldUnityPackage {
  platform: string;
}

export interface Notification {
  id: string;
  created_at?: string;
  createdAt?: string;
  message: string;
  seen: boolean;
  receiverUserId?: string;
  senderUserId: string;
  senderUsername?: string | null;
  type: string;
  title?: string;
  details?: unknown;
  data?: unknown;
}

export interface InstancePlatforms {
  android?: number;
  ios?: number;
  standalonewindows?: number;
}

export interface InstanceData {
  id: string;
  instanceId: string;
  worldId: string;
  ownerId?: string;
  creatorId?: string;
  friends?: string;
  hidden?: string;
  private?: string;
  type: string;
  region: string;
  n_users: number;
  userCount: number;
  capacity: number;
  recommendedCapacity: number;
  platforms?: InstancePlatforms;
  world: WorldData;
}

export type CreateInstanceRegion = "eu" | "jp" | "us" | "use";

export type CreateInstanceType = "friends" | "hidden" | "private" | "public" | "privateplus";

export interface CreateInstanceRequest {
  worldId: string;
  type: CreateInstanceType;
  region: CreateInstanceRegion;
  ownerId?: string;
  canRequestInvite?: boolean;
}

export interface CurrentUser extends UserProfile {
  id: string;
  displayName: string;
  currentAvatarThumbnailImageUrl: string;
  profilePicOverride: string;
  profilePicOverrideThumbnail: string;
  userIcon: string;
  bio: string;
  pronouns: string;
  statusDescription: string;
  date_joined: string;
  tags: string[];
  badges: Badge[];
  friends: string[];
  onlineFriends: string[];
  offlineFriends: string[];
  activeFriends: string[];
  location?: string;
  state: string;
  status: string;
}

export type InstanceVisibility =
  | "public"
  | "friends"
  | "friends+"
  | "invite"
  | "invite+"
  | "group"
  | "group+";

export enum Status {
  Offline = "offline",
  Active = "active",
  JoinMe = "join me",
  AskMe = "ask me",
  Busy = "busy",
}

export interface ParsedInstance {
  worldId: string;
  instancePart: string;
  visibility: InstanceVisibility;
  region: string;
  ownerId: string;
}

export interface InstanceGroup {
  location: string;
  parsed: ParsedInstance;
  instance: InstanceData | null;
  ownerName: string;
  friends: Friend[];
}

export type SupportedPlatform = "standalonewindows" | "android" | "ios" | "web";

export const PLATFORM_META: Record<
  SupportedPlatform,
  { icon: string; label: string }
> = {
  standalonewindows: { icon: "mdi:microsoft-windows", label: "Windows" },
  android: { icon: "mdi:android", label: "Android" },
  ios: { icon: "mdi:apple-ios", label: "iOS" },
  web: { icon: "mdi:web", label: "Web" },
};

export const SUPPORTED_PLATFORMS = Object.keys(
  PLATFORM_META,
) as SupportedPlatform[];

export interface ApiFavoriteGroup {
  id: string;
  name: string;
  displayName: string;
  type: string;
  ownerId: string;
  ownerDisplayName: string;
  tags: string[];
  visibility: string;
}

export interface AvatarUnityPackage {
  id: string;
  assetUrl: string;
  platform: string;
  variant?: string;
  unityVersion?: string;
  assetVersion?: number;
}

export interface AvatarData {
  id: string;
  name: string;
  authorId: string;
  authorName: string;
  imageUrl: string;
  thumbnailImageUrl: string;
  releaseStatus: string;
  performanceRating?: string;
  updated_at?: string;
  created_at?: string;
  version?: number;
  unityPackages?: AvatarUnityPackage[];
}

export interface AvatarStats {
  animatorCount: number;
  audioSourceCount: number;
  blendShapeCount: number;
  boneCount: number;
  bounds: unknown[];
  cameraCount?: number;
  clothCount: number;
  constraintCount: number;
  constraintDepth: number;
  contactCount: number;
  customExpressions: boolean;
  customizeAnimationLayers: boolean;
  enableEyeLook: boolean;
  lightCount: number;
  lineRendererCount: number;
  lipSync: number;
  materialCount: number;
  materialSlotsUsed: number;
  meshCount: number;
  meshIndices: number;
  meshParticleMaxPolygons: number;
  meshPolygons: number;
  meshVertices: number;
  particleCollisionEnabled: boolean;
  particleSystemCount: number;
  particleTrailsEnabled: boolean;
  physBoneColliderCount: number;
  physBoneCollisionCheckCount: number;
  physBoneComponentCount: number;
  physBoneTransformCount: number;
  physicsColliders: number;
  physicsRigidbodies: number;
  skinnedMeshCount: number;
  skinnedMeshIndices: number;
  skinnedMeshPolygons: number;
  skinnedMeshVertices: number;
  totalClothVertices: number;
  totalIndices: number;
  totalMaxParticles: number;
  totalPolygons: number;
  totalTextureUsage: number;
  totalVertices: number;
  trailRendererCount: number;
  writeDefaultsUsed: boolean;
}

export interface FileVersionAnalysis {
  success: boolean;
  fileSize: number;
  uncompressedSize: number;
  performanceRating?: string;
  created_at?: string;
  encryptionKey?: string;
  avatarStats?: AvatarStats;
}

export interface ApiFavorite {
  id: string;
  type: string;
  favoriteId: string;
  tags: string[];
}

export interface InventoryItemMetadata {
  fileId?: string;
  imageUrl?: string;
  animated?: boolean;
  [key: string]: unknown;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  itemType: string;
  itemTypeLabel?: string;
  imageUrl?: string;
  isArchived?: boolean;
  isSeen?: boolean;
  flags?: string[];
  tags?: string[];
  holderId?: string;
  templateId?: string;
  metadata?: InventoryItemMetadata;
}

/** `POST /users/{userId}/boop` body: inventoryItemId alone, or emojiId (+version). */
export interface BoopPayload {
  emojiId?: string;
  emojiVersion?: number;
  inventoryItemId?: string;
}

/** Built-in emoji names accepted by the boop endpoint (`DefaultEmojiID`, incomplete). */
export const DEFAULT_EMOJIS = [
  "default_angry",
  "default_arrowpoint",
  "default_bats",
  "default_beachball",
  "default_beer",
  "default_blushing",
  "default_boo",
  "default_broken_heart",
  "default_candy",
  "default_candy_cane",
  "default_candy_corn",
  "default_cantsee",
  "default_champagne",
  "default_cloud",
  "default_coal",
  "default_confetti",
  "default_crying",
  "default_drink",
  "default_exclamation",
  "default_fire",
  "default_frown",
  "default_gift",
  "default_gifts",
  "default_gingerbread",
  "default_go",
  "default_hand_wave",
  "default_hang_ten",
  "default_heart",
  "default_hourglass",
  "default_ice_cream",
  "default_in_love",
  "default_jack_o_lantern",
  "default_keyboard",
  "default_kiss",
  "default_laugh",
  "default_life_ring",
  "default_mistletoe",
  "default_money",
  "default_music_note",
  "default_neon_shades",
  "default_noheadphones",
  "default_nomic",
  "default_pineapple",
  "default_pizza",
  "default_portal",
  "default_question",
  "default_shush",
  "default_skull",
  "default_smile",
  "default_snow_fall",
  "default_snowball",
  "default_splash",
  "default_spooky_ghost",
  "default_stoic",
  "default_stop",
  "default_sun_lotion",
  "default_sunglasses",
  "default_thinking",
  "default_thumbs_down",
  "default_thumbs_up",
  "default_tomato",
  "default_tongue_out",
  "default_web",
  "default_wow",
  "default_zzz",
] as const;

/** Best-effort mdi icon per built-in emoji; falls back to a generic face. */
export const DEFAULT_EMOJI_ICONS: Record<string, string> = {
  default_angry: "mdi:emoticon-angry-outline",
  default_arrowpoint: "mdi:arrow-up-right",
  default_bats: "mdi:bat",
  default_beachball: "mdi:beach",
  default_beer: "mdi:beer-outline",
  default_blushing: "mdi:emoticon-wink-outline",
  default_boo: "mdi:ghost-outline",
  default_broken_heart: "mdi:heart-broken-outline",
  default_candy: "mdi:candy-outline",
  default_candy_cane: "mdi:candy",
  default_candy_corn: "mdi:corn",
  default_cantsee: "mdi:eye-off-outline",
  default_champagne: "mdi:glass-flute",
  default_cloud: "mdi:cloud-outline",
  default_coal: "mdi:diamond-stone",
  default_confetti: "mdi:party-popper",
  default_crying: "mdi:emoticon-cry-outline",
  default_drink: "mdi:glass-cocktail",
  default_exclamation: "mdi:exclamation",
  default_fire: "mdi:fire",
  default_frown: "mdi:emoticon-sad-outline",
  default_gift: "mdi:gift-outline",
  default_gifts: "mdi:gift-open-outline",
  default_go: "mdi:play",
  default_hand_wave: "mdi:hand-wave-outline",
  default_hang_ten: "mdi:hand-peace",
  default_heart: "mdi:heart-outline",
  default_hourglass: "mdi:timer-sand",
  default_ice_cream: "mdi:ice-cream",
  default_in_love: "mdi:heart-multiple-outline",
  default_jack_o_lantern: "mdi:halloween",
  default_keyboard: "mdi:keyboard-outline",
  default_kiss: "mdi:emoticon-kiss-outline",
  default_laugh: "mdi:emoticon-lol-outline",
  default_life_ring: "mdi:lifebuoy",
  default_money: "mdi:cash",
  default_music_note: "mdi:music-note",
  default_neon_shades: "mdi:sunglasses",
  default_noheadphones: "mdi:headphones-off",
  default_nomic: "mdi:food-apple-outline",
  default_pizza: "mdi:pizza",
  default_question: "mdi:help-circle-outline",
  default_skull: "mdi:skull-outline",
  default_smile: "mdi:emoticon-happy-outline",
  default_snow_fall: "mdi:snowflake",
  default_snowball: "mdi:snowflake",
  default_splash: "mdi:water",
  default_spooky_ghost: "mdi:ghost",
  default_stoic: "mdi:emoticon-neutral-outline",
  default_stop: "mdi:stop",
  default_sun_lotion: "mdi:weather-sunny",
  default_sunglasses: "mdi:sunglasses",
  default_thinking: "mdi:thought-bubble-outline",
  default_thumbs_down: "mdi:thumb-down-outline",
  default_thumbs_up: "mdi:thumb-up-outline",
  default_tongue_out: "mdi:emoticon-tongue-outline",
  default_web: "mdi:web",
  default_wow: "mdi:emoticon-excited-outline",
  default_zzz: "mdi:sleep",
};
