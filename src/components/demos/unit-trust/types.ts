import type { Action, FundState, Outcome } from "./logic";

export type StepId = "declare" | "strike" | "settle" | "pay";

/** What every step view receives: the register, the one dispatch path, the
    last outcome of each control, and a way to move on to another step. */
export interface StepProps {
  state: FundState;
  send: (action: Action, key: string) => Outcome;
  result: (key: string) => Outcome | undefined;
  goTo: (step: StepId) => void;
}
