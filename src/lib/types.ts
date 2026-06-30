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
  created_at: string;
  message: string;
  seen: boolean;
  senderUserId: string;
  senderUsername: string;
  type: string;
  details: string;
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
