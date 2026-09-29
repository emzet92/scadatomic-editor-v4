import type { FleetApi } from "./fleet-api";
import { createIndexedDbFleetApi } from "./indexed-db-fleet-api";

let activeFleetApi: FleetApi = createIndexedDbFleetApi();

/**
 * Allows application bootstrap to replace the local IndexedDB adapter with a
 * real backend client later, without changing Fleet pages/components.
 */
export function configureFleetApi(api: FleetApi) {
  activeFleetApi = api;
}

export const fleetApi: FleetApi = {
  getSummary(request) {
    return activeFleetApi.getSummary(request);
  },
  listDevices(request) {
    return activeFleetApi.listDevices(request);
  },
  listRegistrationKeys(request) {
    return activeFleetApi.listRegistrationKeys(request);
  },
  createRegistrationKey(request) {
    return activeFleetApi.createRegistrationKey(request);
  },
  deleteRegistrationKey(request) {
    return activeFleetApi.deleteRegistrationKey(request);
  },
};
