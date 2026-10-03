import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardPlanningState } from "./wedding-dashboard-empty";

test("keeps the first-event empty state when the wedding has no persisted events", () => {
  const state = getDashboardPlanningState(0, 0);

  assert.equal(state.hasEvents, false);
  assert.equal(state.eventActionLabel, "Create your first event");
  assert.match(state.eventsCopy, /No wedding events/);
});

test("uses persisted Event and Task counts once planning has started", () => {
  const state = getDashboardPlanningState(1, 2);

  assert.equal(state.hasEvents, true);
  assert.equal(state.eventActionLabel, "View events");
  assert.match(state.heroCopy, /1 event and 2 tasks/);
  assert.match(state.eventsCopy, /1 wedding event is currently planned/);
  assert.match(state.tasksCopy, /2 tasks are currently in the planner/);
});
