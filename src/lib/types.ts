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

export interface PrintFiles {
  fileId: string;
  image: string;
}

export interface PrintData {
  id: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  files: PrintFiles;
  note: string;
  ownerId: string;
  sharedBy: string;
  timestamp: string;
  worldId: string;
  worldName: string;
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

export type SupportedPlatform = "standalonewindows" | "android" | "ios";

export const PLATFORM_META: Record<
  SupportedPlatform,
  { icon: string; label: string }
> = {
  standalonewindows: { icon: "mdi:microsoft-windows", label: "Windows" },
  android: { icon: "mdi:android", label: "Android" },
  ios: { icon: "mdi:apple-ios", label: "iOS" },
};

export const SUPPORTED_PLATFORMS = Object.keys(
  PLATFORM_META,
) as SupportedPlatform[];
