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

/**
 * Production HTTP adapter for the future Cloud backend.
 *
 * Endpoint contract intentionally mirrors the IndexedDB development adapter:
 *
 * GET    /api/cloud/projects/:projectId/fleet/summary
 * GET    /api/cloud/projects/:projectId/fleet/devices
 * GET    /api/cloud/projects/:projectId/fleet/registration-keys
 * POST   /api/cloud/projects/:projectId/fleet/registration-keys
 * DELETE /api/cloud/projects/:projectId/fleet/registration-keys/:keyId
 */
export function createHttpFleetApi(baseUrl = ""): FleetApi {
  const root = baseUrl.replace(/\/$/, "");

  return {
    getSummary(request: GetFleetSummaryRequest) {
      return requestJson<FleetSummary>(
        `${root}/api/cloud/projects/${encodeURIComponent(request.projectId)}/fleet/summary`
      );
    },

    listDevices(request: ListFleetDevicesRequest) {
      return requestJson<EdgeDevice[]>(
        `${root}/api/cloud/projects/${encodeURIComponent(request.projectId)}/fleet/devices`
      );
    },

    listRegistrationKeys(request: ListRegistrationKeysRequest) {
      return requestJson<RegistrationKey[]>(
        `${root}/api/cloud/projects/${encodeURIComponent(request.projectId)}/fleet/registration-keys`
      );
    },

    createRegistrationKey(request: CreateRegistrationKeyRequest) {
      return requestJson<RegistrationKey>(
        `${root}/api/cloud/projects/${encodeURIComponent(request.projectId)}/fleet/registration-keys`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: request.name,
            expiresInHours: request.expiresInHours,
          }),
        }
      );
    },

    async deleteRegistrationKey(request: DeleteRegistrationKeyRequest) {
      await requestJson<unknown>(
        `${root}/api/cloud/projects/${encodeURIComponent(request.projectId)}/fleet/registration-keys/${encodeURIComponent(request.keyId)}`,
        { method: "DELETE" }
      );
    },
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Fleet API ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
