import {
  FLEET_STORES,
  deleteRecord,
  getAllByProject,
  putRecord,
} from "../data/indexed-db";
import type {
  CreateRegistrationKeyRequest,
  DeleteRegistrationKeyRequest,
  EdgeDevice,
  FleetSummary,
  GetFleetSummaryRequest,
  ListFleetDevicesRequest,
  ListRegistrationKeysRequest,
  RegistrationKey,
} from "../model/fleet";
import type { FleetApi } from "./fleet-api";

const MOCK_LATENCY_MS = 140;

export function createIndexedDbFleetApi(): FleetApi {
  return {
    async getSummary(request: GetFleetSummaryRequest): Promise<FleetSummary> {
      await mockRequest("GET", `/api/cloud/projects/${request.projectId}/fleet/summary`);
      await ensureSeeded(request.projectId);

      const [devices, keys] = await Promise.all([
        getAllByProject<EdgeDevice>(FLEET_STORES.devices, request.projectId),
        getAllByProject<RegistrationKey>(
          FLEET_STORES.registrationKeys,
          request.projectId
        ),
      ]);

      const now = Date.now();
      const activeRegistrationKeys = keys.filter((key) => {
        if (key.usedAt) return false;
        if (!key.expiresAt) return true;
        return new Date(key.expiresAt).getTime() > now;
      }).length;

      return {
        onlineDevices: devices.filter((device) => device.status === "online").length,
        offlineDevices: devices.filter((device) => device.status === "offline").length,
        provisioningDevices: devices.filter(
          (device) => device.status === "provisioning"
        ).length,
        activeRegistrationKeys,
        totalDevices: devices.length,
      };
    },

    async listDevices(request: ListFleetDevicesRequest): Promise<EdgeDevice[]> {
      await mockRequest("GET", `/api/cloud/projects/${request.projectId}/fleet/devices`);
      await ensureSeeded(request.projectId);
      const devices = await getAllByProject<EdgeDevice>(
        FLEET_STORES.devices,
        request.projectId
      );
      return devices.sort((left, right) => left.name.localeCompare(right.name));
    },

    async listRegistrationKeys(
      request: ListRegistrationKeysRequest
    ): Promise<RegistrationKey[]> {
      await mockRequest(
        "GET",
        `/api/cloud/projects/${request.projectId}/fleet/registration-keys`
      );
      const keys = await getAllByProject<RegistrationKey>(
        FLEET_STORES.registrationKeys,
        request.projectId
      );
      return keys.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async createRegistrationKey(
      request: CreateRegistrationKeyRequest
    ): Promise<RegistrationKey> {
      await mockRequest(
        "POST",
        `/api/cloud/projects/${request.projectId}/fleet/registration-keys`
      );

      const createdAt = new Date();
      const key: RegistrationKey = {
        id: crypto.randomUUID(),
        projectId: request.projectId,
        name: request.name.trim() || "Edge registration key",
        token: createRegistrationToken(),
        createdAt: createdAt.toISOString(),
        expiresAt:
          request.expiresInHours === null
            ? null
            : new Date(
                createdAt.getTime() + request.expiresInHours * 60 * 60 * 1000
              ).toISOString(),
        usedAt: null,
        createdBy: "local.developer@scadatomic",
      };

      await putRecord(FLEET_STORES.registrationKeys, key);
      return key;
    },

    async deleteRegistrationKey(
      request: DeleteRegistrationKeyRequest
    ): Promise<void> {
      await mockRequest(
        "DELETE",
        `/api/cloud/projects/${request.projectId}/fleet/registration-keys/${request.keyId}`
      );
      await deleteRecord(FLEET_STORES.registrationKeys, request.keyId);
    },
  };
}

async function ensureSeeded(projectId: string) {
  const existing = await getAllByProject<EdgeDevice>(FLEET_STORES.devices, projectId);
  if (existing.length > 0) return;

  const now = Date.now();
  const devices: EdgeDevice[] = [
    {
      id: "edge-pump-station-01",
      projectId,
      name: "Pump Station Edge 01",
      status: "online",
      hostname: "scada-edge-pump-01",
      location: "North Pump Station",
      architecture: "amd64",
      operatingSystem: "Ubuntu 24.04 LTS",
      agentVersion: "0.8.2-dev",
      runtimeVersion: "0.12.0-dev",
      ipAddress: "10.24.8.41",
      lastSeenAt: new Date(now - 18_000).toISOString(),
      registeredAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        cpuPercent: 18,
        memoryPercent: 42,
        diskPercent: 31,
      },
      labels: ["production", "pump-station", "docker"],
    },
    {
      id: "edge-boiler-room-01",
      projectId,
      name: "Boiler Room Edge 01",
      status: "online",
      hostname: "scada-edge-boiler-01",
      location: "Boiler Room",
      architecture: "arm64",
      operatingSystem: "Debian 13",
      agentVersion: "0.8.2-dev",
      runtimeVersion: "0.12.0-dev",
      ipAddress: "10.24.9.18",
      lastSeenAt: new Date(now - 41_000).toISOString(),
      registeredAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        cpuPercent: 11,
        memoryPercent: 36,
        diskPercent: 24,
      },
      labels: ["production", "boiler", "arm64"],
    },
    {
      id: "edge-lab-02",
      projectId,
      name: "Lab Edge 02",
      status: "offline",
      hostname: "scada-edge-lab-02",
      location: "Development Lab",
      architecture: "amd64",
      operatingSystem: "Fedora IoT 43",
      agentVersion: "0.8.1-dev",
      runtimeVersion: "0.11.4-dev",
      ipAddress: "10.24.30.72",
      lastSeenAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      registeredAt: new Date(now - 29 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        cpuPercent: 0,
        memoryPercent: 0,
        diskPercent: 47,
      },
      labels: ["development", "lab"],
    },
  ];

  await Promise.all(devices.map((device) => putRecord(FLEET_STORES.devices, device)));
}

function createRegistrationToken() {
  return `scada_edge_${crypto.randomUUID().replaceAll("-", "")}`;
}

async function mockRequest(method: string, path: string) {
  console.info(`[mock-cloud] ${method} ${path}`);
  await new Promise<void>((resolve) => window.setTimeout(resolve, MOCK_LATENCY_MS));
}
