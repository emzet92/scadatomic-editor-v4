import { useCallback, useEffect, useState } from "react";
import { fleetApi } from "../api/client";
import type {
  CreateRegistrationKeyRequest,
  EdgeDevice,
  FleetSummary,
  RegistrationKey,
} from "../model/fleet";

type FleetDashboardState = {
  summary: FleetSummary | null;
  devices: EdgeDevice[];
  registrationKeys: RegistrationKey[];
  loading: boolean;
  error: string | null;
};

const EMPTY_STATE: FleetDashboardState = {
  summary: null,
  devices: [],
  registrationKeys: [],
  loading: true,
  error: null,
};

export function useFleetDashboard(projectId: string) {
  const [state, setState] = useState<FleetDashboardState>(EMPTY_STATE);

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const [summary, devices, registrationKeys] = await Promise.all([
        fleetApi.getSummary({ projectId }),
        fleetApi.listDevices({ projectId }),
        fleetApi.listRegistrationKeys({ projectId }),
      ]);

      setState({
        summary,
        devices,
        registrationKeys,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load fleet",
      }));
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createRegistrationKey = useCallback(
    async (request: Omit<CreateRegistrationKeyRequest, "projectId">) => {
      const key = await fleetApi.createRegistrationKey({ projectId, ...request });
      await reload();
      return key;
    },
    [projectId, reload]
  );

  const deleteRegistrationKey = useCallback(
    async (keyId: string) => {
      await fleetApi.deleteRegistrationKey({ projectId, keyId });
      await reload();
    },
    [projectId, reload]
  );

  return {
    ...state,
    reload,
    createRegistrationKey,
    deleteRegistrationKey,
  };
}
