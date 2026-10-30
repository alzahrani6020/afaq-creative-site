import type { KernelError } from "./types.js";

export function kernelError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  cause?: KernelError
): KernelError {
  return { code, message, details, cause };
}

export const KernelErrors = {
  ENVELOPE_INVALID: (reason: string, details?: Record<string, unknown>) =>
    kernelError("ENVELOPE_INVALID", `Execution envelope is invalid: ${reason}`, details),
  ENGINE_NOT_FOUND: (engineId: string, version?: string) =>
    kernelError("ENGINE_NOT_FOUND", `Engine '${engineId}${version ? `@${version}` : ""}' not found.`, { engine_id: engineId, version }),
  CAPABILITY_DENIED: (action: string, resource: string) =>
    kernelError("CAPABILITY_DENIED", `Capability denied: ${action} on ${resource}.`, { action, resource }),
  POLICY_DENIED: (action: string, resource: string) =>
    kernelError("POLICY_DENIED", `Policy denied: ${action} on ${resource}.`, { action, resource }),
  BUDGET_EXCEEDED: (kind: string, limit: number | undefined, actual: number | undefined) =>
    kernelError("BUDGET_EXCEEDED", `Budget exceeded: ${kind}.`, { kind, limit, actual }),
  DEADLINE_EXCEEDED: (deadline?: string | number) =>
    kernelError("DEADLINE_EXCEEDED", "Deadline exceeded.", { deadline }),
  ENGINE_EXECUTION_FAILED: (reason: string, cause?: KernelError) =>
    kernelError("ENGINE_EXECUTION_FAILED", `Engine execution failed: ${reason}`, {}, cause),
  INTERNAL_ERROR: (reason: string) =>
    kernelError("INTERNAL_ERROR", `Internal kernel error: ${reason}`),
} as const;
