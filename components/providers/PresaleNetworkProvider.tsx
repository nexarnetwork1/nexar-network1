"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PRESALE_NETWORK_ID,
  getPresaleNetwork,
  type PresaleNetworkConfig,
  type PresaleNetworkId,
} from "@/lib/constants/presale-networks";

type PresaleNetworkContextValue = {
  networkId: PresaleNetworkId;
  network: PresaleNetworkConfig;
  setNetworkId: (id: PresaleNetworkId) => void;
};

const PresaleNetworkContext = createContext<PresaleNetworkContextValue | null>(
  null,
);

type PresaleNetworkProviderProps = {
  children: ReactNode;
  networkId?: PresaleNetworkId;
  /** When true, network is fixed (e.g. dual presale cards) and cannot be switched. */
  locked?: boolean;
};

export function PresaleNetworkProvider({
  children,
  networkId: initialNetworkId = DEFAULT_PRESALE_NETWORK_ID,
  locked = false,
}: PresaleNetworkProviderProps) {
  const [networkId, setNetworkIdState] =
    useState<PresaleNetworkId>(initialNetworkId);

  const setNetworkId = useCallback(
    (id: PresaleNetworkId) => {
      if (locked) return;
      setNetworkIdState(id);
    },
    [locked],
  );

  const value = useMemo(
    () => ({
      networkId,
      network: getPresaleNetwork(networkId),
      setNetworkId,
    }),
    [networkId, setNetworkId],
  );

  return (
    <PresaleNetworkContext.Provider value={value}>
      {children}
    </PresaleNetworkContext.Provider>
  );
}

export function usePresaleNetworkContext(): PresaleNetworkContextValue {
  const ctx = useContext(PresaleNetworkContext);
  if (!ctx) {
    const network = getPresaleNetwork(DEFAULT_PRESALE_NETWORK_ID);
    return {
      networkId: DEFAULT_PRESALE_NETWORK_ID,
      network,
      setNetworkId: () => {},
    };
  }
  return ctx;
}
