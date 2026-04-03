import type { InstanceVisibility, ParsedInstance } from "../types";

export function parseInstanceId(location: string): ParsedInstance | null {
  if (!location || location === "private" || location === "offline" || location === "") {
    return null;
  }

  const colonIdx = location.indexOf(":");
  if (colonIdx === -1) return null;

  const worldId = location.substring(0, colonIdx);
  const instancePart = location.substring(colonIdx + 1);

  const visibility = parseVisibility(instancePart);
  const region = parseRegion(instancePart);
  const ownerId = parseOwnerId(instancePart, visibility);

  return { worldId, instancePart, visibility, region, ownerId };
}

function parseVisibility(instancePart: string): InstanceVisibility {
  if (instancePart.includes("~friends(")) return "friends";
  if (instancePart.includes("~hidden(")) return "friends+";
  if (instancePart.includes("~private(") && instancePart.includes("~canRequestInvite")) return "invite+";
  if (instancePart.includes("~private(")) return "invite";
  if (instancePart.includes("~groupAccessType(public)")) return "group";
  if (instancePart.includes("~groupAccessType(plus)") || instancePart.includes("~group(")) return "group+";
  return "public";
}

function parseRegion(instancePart: string): string {
  const match = instancePart.match(/~region\(([^)]+)\)/);
  return match ? match[1] : "us";
}

function parseOwnerId(instancePart: string, visibility: InstanceVisibility): string {
  if (visibility === "friends") {
    const match = instancePart.match(/~friends\(([^)]+)\)/);
    return match ? match[1] : "";
  }
  if (visibility === "friends+") {
    const match = instancePart.match(/~hidden\(([^)]+)\)/);
    return match ? match[1] : "";
  }
  if (visibility === "group" || visibility === "group+") {
    const match = instancePart.match(/~group\(([^)]+)\)/);
    return match ? match[1] : "";
  }
  if (visibility === "invite" || visibility === "invite+") {
    const match = instancePart.match(/~private\(([^)]+)\)/);
    return match ? match[1] : "";
  }
  return "";
}

export function visibilityLabel(v: InstanceVisibility): string {
  const labels: Record<InstanceVisibility, string> = {
    public: "Public",
    friends: "Friends",
    "friends+": "Friend+",
    invite: "Invite",
    "invite+": "Invite+",
    group: "Group",
    "group+": "Group+",
  };
  return labels[v];
}

export function regionLabel(region: string): string {
  const labels: Record<string, string> = {
    us: "US West",
    use: "US East",
    eu: "Europe",
    jp: "Japan",
  };
  return labels[region] || region.toUpperCase();
}
