/**
 * Represents a single step in a data transformation pipeline
 * Each step is a pure function that transforms input to output
 * @template Input The type of data this step accepts
 * @template Output The type of data this step produces
 */
export interface Step<Input, Output> {
  /**
   * Human-readable name for logging and debugging
   */
  name: string;

  /**
   * Execute the step with given input
   * @param input The input data to process
   * @returns Promise of output data
   * @throws Error if step execution fails
   */
  execute(input: Input): Promise<Output>;
}

/**
 * Configuration for pipeline execution
 */
export interface PipelineConfig {
  /**
   * If true, log step execution progress
   */
  verbose?: boolean;

  /**
   * If true, throw error on first failure; if false, collect all errors
   */
  failFast?: boolean;
}

/**
 * Result of executing a step
 */
export interface StepResult<T> {
  step: string;
  success: boolean;
  data?: T;
  error?: Error;
  duration: number; // milliseconds
}

/**
 * Result of executing an entire pipeline
 */
export interface PipelineResult<T> {
  success: boolean;
  data?: T;
  results: StepResult<unknown>[];
  errors: Error[];
  totalDuration: number; // milliseconds
}

/**
 * Abstract base class for implementing steps
 * Provides default name generation from class name
 */
export abstract class AbstractStep<Input, Output> implements Step<Input, Output> {
  name: string;

  constructor(customName?: string) {
    this.name = customName || this.constructor.name;
  }

  abstract execute(input: Input): Promise<Output>;
}

/**
 * Execute a linear pipeline of steps
 * Each step receives output from previous step as input
 * @param steps Array of steps to execute in order
 * @param initialInput Input to pass to first step
 * @param config Pipeline configuration
 * @returns PipelineResult with execution details
 */
export async function executePipeline<T>(
  steps: Step<unknown, unknown>[],
  initialInput: unknown,
  config: PipelineConfig = {}
): Promise<PipelineResult<T>> {
  const { verbose = false, failFast = true } = config;
  const startTime = performance.now();
  const results: StepResult<unknown>[] = [];
  const errors: Error[] = [];

  let currentInput: unknown = initialInput;

  for (const step of steps) {
    const stepStartTime = performance.now();
    try {
      if (verbose) {
        console.log(`  ▶ ${step.name}...`);
      }

      currentInput = await step.execute(currentInput);

      const duration = performance.now() - stepStartTime;
      results.push({
        step: step.name,
        success: true,
        data: currentInput,
        duration,
      });

      if (verbose) {
        console.log(`  ✓ ${step.name} (${duration.toFixed(2)}ms)`);
      }
    } catch (error) {
      const stepError = error instanceof Error ? error : new Error(String(error));
      const duration = performance.now() - stepStartTime;

      results.push({
        step: step.name,
        success: false,
        error: stepError,
        duration,
      });

      errors.push(stepError);

      if (verbose) {
        console.log(`  ✗ ${step.name} failed: ${stepError.message}`);
      }

      if (failFast) {
        const totalDuration = performance.now() - startTime;
        return {
          success: false,
          results,
          errors,
          totalDuration,
        };
      }
    }
  }

  const totalDuration = performance.now() - startTime;

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? (currentInput as T) : undefined,
    results,
    errors,
    totalDuration,
  };
}

/**
 * Typed pipeline builder supporting heterogeneous step transformations
 * Preserves type information through the chain: Input → Output₁ → Output₂ → ... → OutputN
 *
 * Example:
 *   const result = await pipeline<string>()
 *     .addStep(step1 as Step<string, Config>)
 *     .addStep(step2 as Step<Config, Link[]>)
 *     .addStep(step3 as Step<Link[], ProcessedLinks>)
 *     .execute("data");
 *   // result.data: ProcessedLinks
 */
export class TypedPipelineBuilder<TInitial, TCurrent> {
  private steps: Step<unknown, unknown>[] = [];

  constructor(initialType?: TInitial) {
    // Marker for type tracking only
  }

  /**
   * Add a step that transforms TCurrent → TNext
   * Type-safe: compiler ensures step input type matches current output type
   */
  addStep<TNext>(step: Step<TCurrent, TNext>): TypedPipelineBuilder<TInitial, TNext> {
    this.steps.push(step);
    return this as unknown as TypedPipelineBuilder<TInitial, TNext>;
  }

  /**
   * Execute the pipeline and return result with final type
   */
  async execute(
    initialInput: TInitial,
    config?: PipelineConfig
  ): Promise<PipelineResult<TCurrent>> {
    return executePipeline<TCurrent>(this.steps, initialInput, config);
  }

  /**
   * Get the current steps (for debugging)
   */
  getSteps(): Step<unknown, unknown>[] {
    return [...this.steps];
  }
}

/**
 * Create a new typed pipeline builder
 * @template T Initial input type
 * @returns Pipeline builder with type-safe addStep method
 */
export function typedPipeline<T>(): TypedPipelineBuilder<T, T> {
  return new TypedPipelineBuilder<T, T>();
}

/**
 * Legacy pipeline builder (for backward compatibility)
 * Does not preserve types through the chain
 */
export class PipelineBuilder<Input, Output> {
  private steps: Step<unknown, unknown>[] = [];

  /**
   * Add a step to the pipeline
   */
  addStep<Next>(step: Step<unknown, Next>): PipelineBuilder<Input, Next> {
    this.steps.push(step);
    return this as unknown as PipelineBuilder<Input, Next>;
  }

  /**
   * Execute the built pipeline
   */
  async execute(initialInput: Input, config?: PipelineConfig): Promise<PipelineResult<Output>> {
    return executePipeline<Output>(this.steps, initialInput, config);
  }

  /**
   * Get the current steps (for debugging)
   */
  getSteps(): Step<unknown, unknown>[] {
    return [...this.steps];
  }
}

/**
 * Helper to create a legacy pipeline builder (backward compatible)
 */
export function pipeline<T>(): PipelineBuilder<T, T> {
  return new PipelineBuilder();
}

export default {
  executePipeline,
  TypedPipelineBuilder,
  typedPipeline,
  PipelineBuilder,
  pipeline,
};
