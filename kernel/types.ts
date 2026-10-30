/**
 * Kernel foundational types.
 * STAGE 1 — CONTRACTS: stable, engine-neutral definitions.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface TraceContext {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  sampled: boolean;
  baggage: Record<string, string>;
}

export interface PolicyRule {
  id: string;
  effect: "allow" | "deny";
  action: string;
  resource?: string;
  condition?: (context: PolicyContext) => boolean;
}

export interface PolicyContext {
  principal?: Record<string, unknown>;
  action: string;
  resource: string;
  envelope: ExecutionEnvelope;
}

export interface Policy {
  rules: PolicyRule[];
  defaultEffect: "allow" | "deny";
}

export interface Budget {
  max_cost?: number;
  max_tokens?: number;
  max_calls?: number;
  currency?: string;
}

export interface Deadline {
  absolute_time?: string; // ISO 8601
  max_duration_ms?: number;
}

export interface EvidenceRef {
  id: string;
  kind: string;
  uri?: string;
  hash?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionEnvelope {
  execution_id: string;
  request_id: string;
  trace: TraceContext;
  timestamp: string;
  engine_ref: EngineRef;
  payload: unknown;
  policy?: Policy;
  budget?: Budget;
  deadline?: Deadline;
  evidence_refs?: EvidenceRef[];
  metadata?: Record<string, unknown>;
}

export interface EngineRef {
  engine_id: string;
  version?: string;
  capability?: string;
}

export interface Capability {
  name: string;
  version: string;
  permissions: Permission[];
  input_schema?: unknown;
  output_schema?: unknown;
}

export interface Permission {
  action: string;
  resource: string;
}

export interface EngineMetadata {
  engine_id: string;
  version: string;
    capabilities: Capability[];
}

export interface EngineResult {
  success: boolean;
  output?: unknown;
  error?: KernelError;
  evidence_refs: EvidenceRef[];
  metadata: {
    engine_id: string;
    engine_version: string;
    execution_id: string;
    request_id: string;
    trace_id: string;
    duration_ms: number;
    cost?: number;
    tokens?: number;
    [key: string]: unknown;
  };
}

export interface Engine {
  readonly metadata: EngineMetadata;
  execute(envelope: ExecutionEnvelope): Promise<EngineResult>;
}

export interface EvaluationHook {
  before?: (envelope: ExecutionEnvelope) => Promise<void> | void;
  after?: (envelope: ExecutionEnvelope, result: EngineResult) => Promise<void> | void;
}

export interface KernelError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  cause?: KernelError;
}
