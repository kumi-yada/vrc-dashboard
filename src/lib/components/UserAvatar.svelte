<script lang="ts">
  import type { UserProfile } from "../types";

  interface Props {
    friend: Pick<
      UserProfile,
      "displayName" | "profilePicOverrideThumbnail" | "currentAvatarThumbnailImageUrl" | "currentAvatarImageUrl"
    >;
    size?: number;
    radius?: string;
    grayscale?: number;
    brightness?: number;
  }

  let {
    friend,
    size = 42,
    radius = "10px",
    grayscale = 0,
    brightness = 1,
  }: Props = $props();

  function getAvatar(user: Props["friend"]): string {
    return user.profilePicOverrideThumbnail || user.currentAvatarThumbnailImageUrl || user.currentAvatarImageUrl || "";
  }

  let filter = $derived(
    grayscale > 0 || brightness !== 1
      ? `grayscale(${grayscale}%) brightness(${brightness})`
      : undefined,
  );
</script>

<img
  src={getAvatar(friend)}
  alt={friend.displayName}
  class="user-avatar"
  loading="lazy"
  title={friend.displayName}
  style:width={`${size}px`}
  style:height={`${size}px`}
  style:border-radius={radius}
  style:filter={filter}
/>

<style>
  .user-avatar {
    object-fit: cover;
    background: var(--bg-input);
    flex-shrink: 0;
  }
</style>