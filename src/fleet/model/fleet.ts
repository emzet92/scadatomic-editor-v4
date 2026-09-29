export type EdgeDeviceStatus = "online" | "offline" | "provisioning";

export type EdgeDeviceMetrics = {
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
};

export type EdgeDevice = {
  id: string;
  projectId: string;
  name: string;
  status: EdgeDeviceStatus;
  hostname: string;
  location: string;
  architecture: "amd64" | "arm64";
  operatingSystem: string;
  agentVersion: string;
  runtimeVersion: string;
  ipAddress: string;
  lastSeenAt: string;
  registeredAt: string;
  metrics: EdgeDeviceMetrics;
  labels: string[];
};

export type RegistrationKey = {
  id: string;
  projectId: string;
  name: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  createdBy: string;
};

export type FleetSummary = {
  onlineDevices: number;
  offlineDevices: number;
  provisioningDevices: number;
  activeRegistrationKeys: number;
  totalDevices: number;
};

export type CreateRegistrationKeyRequest = {
  projectId: string;
  name: string;
  expiresInHours: number | null;
};

export type ListFleetDevicesRequest = {
  projectId: string;
};

export type ListRegistrationKeysRequest = {
  projectId: string;
};

export type GetFleetSummaryRequest = {
  projectId: string;
};

export type DeleteRegistrationKeyRequest = {
  projectId: string;
  keyId: string;
};
