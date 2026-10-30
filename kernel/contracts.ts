/**
 * Kernel contracts.
 * STAGE 1 — CONTRACTS: exported stable contracts used by Runtime and engines.
 */

export type {
  Budget,
  Capability,
  Deadline,
  Engine,
  EngineMetadata,
  EngineRef,
  EngineResult,
  EvaluationHook,
  EvidenceRef,
  ExecutionEnvelope,
  JsonValue,
  KernelError,
  Permission,
  Policy,
  PolicyContext,
  PolicyRule,
  TraceContext,
} from "./types.js";

export { kernelError, KernelErrors } from "./errors.js";

import type { ExecutionEnvelope } from "./types.js";

export function makeEnvelope(
  partial: Omit<ExecutionEnvelope, "execution_id" | "request_id" | "trace" | "timestamp"> &
    Partial<Pick<ExecutionEnvelope, "execution_id" | "request_id" | "trace" | "timestamp">>
): ExecutionEnvelope {
  const now = new Date().toISOString();
  return {
    execution_id: partial.execution_id ?? generateId("exec"),
    request_id: partial.request_id ?? generateId("req"),
    trace: partial.trace ?? {
      trace_id: generateId("trace"),
      span_id: generateId("span"),
      sampled: true,
      baggage: {},
    },
    timestamp: partial.timestamp ?? now,
    engine_ref: partial.engine_ref,
    payload: partial.payload,
    policy: partial.policy,
    budget: partial.budget,
    deadline: partial.deadline,
    evidence_refs: partial.evidence_refs ?? [],
    metadata: partial.metadata ?? {},
  };
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
