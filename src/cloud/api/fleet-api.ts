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

/**
 * Backend boundary for Cloud/Fleet Management.
 *
 * The UI only depends on this interface. The development implementation uses
 * IndexedDB, while a future backend can replace it with HTTP/RPC without
 * changing the page or hooks.
 */
export interface FleetApi {
  getSummary(request: GetFleetSummaryRequest): Promise<FleetSummary>;
  listDevices(request: ListFleetDevicesRequest): Promise<EdgeDevice[]>;
  listRegistrationKeys(
    request: ListRegistrationKeysRequest
  ): Promise<RegistrationKey[]>;
  createRegistrationKey(
    request: CreateRegistrationKeyRequest
  ): Promise<RegistrationKey>;
  deleteRegistrationKey(request: DeleteRegistrationKeyRequest): Promise<void>;
}
