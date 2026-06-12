/* Team Planner miniature: three views of the same reducer-held state (Team day,
   Hot desks, Resources) plus a persistent plain-English panel. Every mutation, manual
   or chip, is an Action dispatched through validate() then apply(), exactly the
   production pattern where each model-driven change passes a strict schema first. */

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";
import { INITIAL_STATE, TODAY_INDEX, dayAt, type PlannerState } from "./data";
import { apply, validate, type Action, type Validation } from "./logic";
import { FOCUS_RING } from "./controls";
import TeamDay from "./TeamDay";
import { HotDesksView, ResourcesView } from "./Bookings";
import AskPanel from "./AskPanel";

type ReducerAction = Action | { type: "reset" };

/** validate-then-apply: an action that fails validation can never change state, no
    matter which surface dispatched it. */
function plannerReducer(state: PlannerState, action: ReducerAction): PlannerState {
  if (action.type === "reset") return INITIAL_STATE;
  return validate(action, state).ok ? apply(state, action) : state;
}

const TAB_TRIGGER = cn(
  "-mb-px border-b-2 border-transparent px-2.5 pb-2 pt-1 text-xs font-medium text-ink-3 transition-colors hover:text-ink-2",
  "data-[state=active]:border-brand-600 data-[state=active]:text-brand-700",
  FOCUS_RING
);

export default function TeamPlannerDemo() {
  const [state, dispatch] = React.useReducer(plannerReducer, INITIAL_STATE);
  const [dayIndex, setDayIndex] = React.useState(TODAY_INDEX);
  const [resetKey, setResetKey] = React.useState(0);
  const day = dayAt(dayIndex);

  /** The single dispatch path shared by forms and chips; returns the validator's
      verdict so the caller can render the same mono ok/error line everywhere. */
  function send(action: Action): Validation {
    const result = validate(action, state);
    if (result.ok) dispatch(action);
    return result;
  }

  function reset() {
    dispatch({ type: "reset" });
    setDayIndex(TODAY_INDEX);
    setResetKey((k) => k + 1); // remounts the views, clearing forms and staged runs
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs.Root defaultValue="day">
        <Tabs.List aria-label="Planner views" className="mb-3 flex border-b border-line">
          <Tabs.Trigger value="day" className={TAB_TRIGGER}>
            Team day
          </Tabs.Trigger>
          <Tabs.Trigger value="desks" className={TAB_TRIGGER}>
            Hot desks
          </Tabs.Trigger>
          <Tabs.Trigger value="resources" className={TAB_TRIGGER}>
            Resources
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="day" className="outline-none">
          <TeamDay key={`day-${resetKey}`} state={state} dayIndex={dayIndex} onDayIndexChange={setDayIndex} send={send} />
        </Tabs.Content>
        <Tabs.Content value="desks" className="outline-none">
          <HotDesksView key={`desks-${resetKey}`} state={state} day={day} send={send} />
        </Tabs.Content>
        <Tabs.Content value="resources" className="outline-none">
          <ResourcesView key={`resources-${resetKey}`} state={state} day={day} send={send} />
        </Tabs.Content>
      </Tabs.Root>

      <AskPanel key={`ask-${resetKey}`} state={state} day={day} send={send} onReset={reset} />

      <p className="font-mono text-[11px] leading-relaxed text-ink-3">
        Synthetic team of six across three planning days, clock fixed at 11:20. The plain-English
        chips are scripted in this miniature, but the tool call, the schema validation and the
        state mutation mirror production, where Claude calls the same typed tools over MCP. The
        action validator here is the same shape production uses for all eighteen action types.
      </p>
    </div>
  );
}
