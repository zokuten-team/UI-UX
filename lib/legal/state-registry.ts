/**
 * State backend router.
 *
 * The UI sends only `stateId`. This registry decides which isolated rule pack
 * receives the request. Add a new verified state here only after its statutes,
 * schedules, notifications and regression fixtures are ready.
 */
export type StateBackend = {
  key: string;
  status: "connected" | "placeholder";
  ruleModule: string;
  dataSet: string;
};

const connectedBackends: Record<string, StateBackend> = {
  ka: {
    key: "karnataka",
    status: "connected",
    ruleModule: "lib/legal/karnataka.ts",
    dataSet: "Karnataka Court Fees and Suits Valuation Act rule pack",
  },
};

export function getStateBackend(stateId: string): StateBackend {
  return connectedBackends[stateId] ?? {
    key: stateId,
    status: "placeholder",
    ruleModule: `lib/legal/states/${stateId}/rules.ts`,
    dataSet: `lib/legal/states/${stateId}/data.ts`,
  };
}

