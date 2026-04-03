export interface Badge {
  badgeDescription: string;
  badgeId: string;
  badgeImageUrl: string;
  badgeName: string;
  showcased: boolean;
}

export interface Friend {
  id: string;
  displayName: string;
  currentAvatarThumbnailImageUrl: string;
  profilePicOverrideThumbnail: string;
  userIcon: string;
  status: string;
  statusDescription: string;
  location: string;
  worldId: string;
  instanceId: string;
  state: string;
  last_platform: string;
  tags: string[];
  isFriend: boolean;
}

export interface WorldData {
  id: string;
  name: string;
  description: string;
  authorName: string;
  capacity: number;
  recommendedCapacity: number;
  imageUrl: string;
  thumbnailImageUrl: string;
  favorites: number;
  visits: number;
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
  world: WorldData;
}

export interface CurrentUser {
  id: string;
  displayName: string;
  currentAvatarThumbnailImageUrl: string;
  profilePicOverride: string;
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
  friends: Friend[];
}
