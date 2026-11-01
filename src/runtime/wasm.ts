/**
 * Plan A Architecture Stub: WebAssembly Compiler Runtime for Ada
 *
 * EVALUATION & ARCHITECTURAL DECISION:
 * ------------------------------------
 * In evaluating compilation strategies for AdaPT (an entirely client-side,
 * zero-backend educational IDE for concurrent Ada):
 *
 * 1. Plan A investigated compiling Ada source code directly in the browser via
 *    a WebAssembly-compiled GNAT/LLVM toolchain (e.g. llvm-gnat, GNAT LLVM WASM target).
 * 2. Findings:
 *    - GNAT backend compiler binaries targeting or compiled to WASM are currently
 *      not available as lightweight, self-contained client-side npm packages.
 *    - Emscripten/WASI cross-compilation of GCC/GNAT produces multi-hundred-megabyte
 *      binaries requiring persistent POSIX threading emulation (SharedArrayBuffer),
 *      complex cross-origin isolation headers (COOP/COEP), and a full virtual filesystem.
 *    - Such overhead conflicts directly with the educational goals of AdaPT:
 *      instant zero-install page load, offline capability, and universal browser support.
 *
 * 3. Architectural Boundary:
 *    - AdaPT adopts "Plan B": client-side TypeScript syntax linting (`linter.ts`)
 *      and preprogrammed simulation execution (`compiler.ts`).
 *    - This module (`wasm.ts`) defines the interface contracts for Plan A so that
 *      a future WebAssembly compiler backend can be dropped in without refactoring
 *      any UI components or the `CompilerService` abstraction.
 */

import type { CompileResult, CompilerService, RunOptions } from '../types';

export interface WasmCompilerConfig {
  /** URL or buffer of the GNAT WebAssembly module */
  binaryUrl?: string;
  /** Virtual memory allocation in MB */
  memoryLimitMb?: number;
  /** Maximum execution time before hard abort */
  timeoutMs?: number;
}

export interface WasmExecutionResult {
  exitCode: number;
  stdout: string[];
  stderr: string[];
  durationMs: number;
}

/**
 * Checks whether WebAssembly compilation and runtime prerequisites are met
 * in the current browser environment.
 */
export function isWasmSupported(): boolean {
  // Plan A is currently a placeholder stub in AdaPT MVP.
  // In a future release, this will check for WebAssembly.instantiateStreaming,
  // SharedArrayBuffer, and cross-origin isolation.
  return false;
}

/**
 * Placeholder for in-browser WASM compilation of Ada code.
 * Rejects with an explanatory message while Plan B is active.
 */
export async function compileWithWasm(_code: string, _config?: WasmCompilerConfig): Promise<CompileResult> {
  return Promise.reject(
    new Error(
      'Plan A (WebAssembly GNAT) is not available in this build. AdaPT is running under Plan B Simulation Mode.'
    )
  );
}

/**
 * Placeholder for executing WebAssembly-compiled Ada bytecode.
 */
export async function runWithWasm(
  _wasmBinary: Uint8Array,
  _options: RunOptions
): Promise<{ exitCode: number; stoppedByUser?: boolean }> {
  return Promise.reject(
    new Error(
      'Plan A (WebAssembly GNAT runtime) is not available in this build. AdaPT is running under Plan B Simulation Mode.'
    )
  );
}

/**
 * Optional Plan A CompilerService stub.
 * Currently null until a WASM binary distribution is packaged.
 */
export const wasmCompilerService: CompilerService | null = null;
