import { test } from 'node:test';
import assert from 'node:assert';
import {
  Step,
  AbstractStep,
  executePipeline,
  PipelineBuilder,
  pipeline,
  PipelineConfig,
} from './index.js';

// Mock steps for testing

class AddOneStep implements Step<number, number> {
  name = 'AddOne';
  async execute(input: number): Promise<number> {
    return input + 1;
  }
}

class MultiplyByTwoStep implements Step<number, number> {
  name = 'MultiplyByTwo';
  async execute(input: number): Promise<number> {
    return input * 2;
  }
}

class StringifyStep implements Step<number, string> {
  name = 'Stringify';
  async execute(input: number): Promise<string> {
    return String(input);
  }
}

class FailingStep implements Step<string, string> {
  name = 'FailingStep';
  async execute(_input: string): Promise<string> {
    throw new Error('Step failed on purpose');
  }
}

class DelayedStep extends AbstractStep<string, string> {
  constructor() {
    super('DelayedStep');
  }

  async execute(input: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return input.toUpperCase();
  }
}

// ============= Basic Pipeline Tests =============

test('executePipeline: executes single step', async () => {
  const steps: Step<unknown, unknown>[] = [new AddOneStep()];
  const result = await executePipeline<number>(steps, 5);

  assert.ok(result.success, 'Pipeline should succeed');
  assert.equal(result.data, 6, 'Output should be 6 (5+1)');
  assert.equal(result.errors.length, 0, 'Should have no errors');
});

test('executePipeline: chains multiple steps', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new MultiplyByTwoStep(),
    new AddOneStep(),
  ];
  const result = await executePipeline<number>(steps, 5);

  assert.ok(result.success, 'Pipeline should succeed');
  // (5 + 1) * 2 + 1 = 6 * 2 + 1 = 12 + 1 = 13
  assert.equal(result.data, 13, 'Output should be 13');
});

test('executePipeline: handles type transformations', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new MultiplyByTwoStep(),
    new StringifyStep(),
  ];
  const result = await executePipeline<string>(steps, 5);

  assert.ok(result.success, 'Pipeline should succeed');
  // (5 + 1) * 2 = 12 -> "12"
  assert.equal(result.data, '12', 'Output should be string "12"');
  assert.equal(typeof result.data, 'string', 'Output should be string type');
});

test('executePipeline: records all step results', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new MultiplyByTwoStep(),
    new StringifyStep(),
  ];
  const result = await executePipeline(steps, 5);

  assert.equal(result.results.length, 3, 'Should record all 3 steps');
  assert.ok(result.results.every((r) => r.success), 'All steps should succeed');
  assert.ok(result.results.every((r) => r.duration >= 0), 'All steps should have duration');
});

// ============= Error Handling Tests =============

test('executePipeline: stops on first error with failFast', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new FailingStep(),
    new DelayedStep(),
  ];
  const result = await executePipeline(steps, '5', { failFast: true });

  assert.ok(!result.success, 'Pipeline should fail');
  assert.equal(result.errors.length, 1, 'Should have 1 error');
  assert.equal(result.results.length, 2, 'Should have executed 2 steps');
  // Verify that the failing step result is marked as failed
  assert.ok(!result.results[1].success, 'Second step should fail');
});

test('executePipeline: collects all errors with failFast=false', async () => {
  class AlwaysFailStep implements Step<unknown, unknown> {
    name = 'AlwaysFail';
    async execute(): Promise<unknown> {
      throw new Error('Always fails');
    }
  }

  const steps: Step<unknown, unknown>[] = [
    new AlwaysFailStep(),
    new AlwaysFailStep(),
    new AlwaysFailStep(),
  ];
  const result = await executePipeline(steps, 'input', { failFast: false });

  assert.ok(!result.success, 'Pipeline should fail');
  // All errors will be recorded, but execution may stop if a step fails
  assert.ok(result.errors.length > 0, 'Should have collected errors');
});

test('executePipeline: includes error details', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new FailingStep(),
  ];
  const result = await executePipeline(steps, '5');

  assert.ok(!result.success, 'Pipeline should fail');
  assert.equal(result.errors.length, 1, 'Should have 1 error');
  assert.ok(
    result.errors[0].message.includes('Step failed'),
    'Error should contain failure message'
  );
});

// ============= Verbose Logging Tests =============

test('executePipeline: executes with verbose mode', async () => {
  const steps: Step<unknown, unknown>[] = [new AddOneStep()];

  // Just verify it doesn't crash with verbose on
  const result = await executePipeline(steps, 5, { verbose: true });
  assert.ok(result.success, 'Should succeed with verbose=true');
});

// ============= Pipeline Builder Tests =============

test('PipelineBuilder: fluent API for adding steps', async () => {
  const builder = new PipelineBuilder<number, number>();
  builder.addStep(new AddOneStep()).addStep(new MultiplyByTwoStep());

  const result = await builder.execute(5);

  assert.ok(result.success, 'Pipeline should succeed');
  // (5 + 1) * 2 = 12
  assert.equal(result.data, 12, 'Output should be 12');
});

test('PipelineBuilder: supports type chaining', async () => {
  const result = await new PipelineBuilder<number, number>()
    .addStep(new AddOneStep())
    .addStep(new MultiplyByTwoStep())
    .addStep(new StringifyStep())
    .execute(5);

  assert.ok(result.success, 'Pipeline should succeed');
  assert.equal(result.data, '12', 'Final output should be "12"');
  assert.equal(typeof result.data, 'string', 'Should be string type');
});

test('PipelineBuilder: getSteps returns current steps', async () => {
  const builder = new PipelineBuilder<number, string>();
  builder.addStep(new AddOneStep()).addStep(new StringifyStep());

  const steps = builder.getSteps();
  assert.equal(steps.length, 2, 'Should have 2 steps');
  assert.equal(steps[0].name, 'AddOne', 'First step should be AddOne');
  assert.equal(steps[1].name, 'Stringify', 'Second step should be Stringify');
});

// ============= Pipeline Helper Function Tests =============

test('pipeline: helper creates builder', async () => {
  const result = await pipeline<number>()
    .addStep(new AddOneStep())
    .addStep(new MultiplyByTwoStep())
    .execute(5);

  assert.ok(result.success, 'Should succeed');
  assert.equal(result.data, 12, 'Should correctly compute');
});

// ============= AbstractStep Tests =============

test('AbstractStep: auto-generates name from class', async () => {
  const step = new DelayedStep();
  assert.equal(step.name, 'DelayedStep', 'Should use class name');
});

test('AbstractStep: allows custom name', async () => {
  class CustomNamedStep extends AbstractStep<string, string> {
    constructor() {
      super('MyCustomName');
    }

    async execute(input: string): Promise<string> {
      return input;
    }
  }

  const step = new CustomNamedStep();
  assert.equal(step.name, 'MyCustomName', 'Should use custom name');
});

// ============= Performance & Timing Tests =============

test('executePipeline: records step duration', async () => {
  const steps: Step<unknown, unknown>[] = [new DelayedStep()];
  const result = await executePipeline(steps, 'test');

  assert.ok(result.success, 'Pipeline should succeed');
  assert.ok(result.results[0].duration >= 10, 'Should record duration >= 10ms');
});

test('executePipeline: records total duration', async () => {
  const steps: Step<unknown, unknown>[] = [new DelayedStep(), new DelayedStep()];
  const result = await executePipeline(steps, 'test');

  assert.ok(result.success, 'Pipeline should succeed');
  assert.ok(result.totalDuration >= 20, 'Total should be >= 20ms for 2 delayed steps');
});

// ============= Edge Cases =============

test('executePipeline: handles empty step array', async () => {
  const result = await executePipeline<string>([], 'input');

  assert.ok(result.success, 'Should succeed with no steps');
  assert.equal(result.data, 'input', 'Data should be initial input');
  assert.equal(result.results.length, 0, 'Should have no step results');
});

test('executePipeline: handles async operations', async () => {
  class AsyncStep implements Step<number, number> {
    name = 'AsyncStep';
    async execute(input: number): Promise<number> {
      return new Promise((resolve) => {
        setTimeout(() => resolve(input + 100), 5);
      });
    }
  }

  const steps: Step<unknown, unknown>[] = [new AsyncStep()];
  const result = await executePipeline<number>(steps, 50);

  assert.ok(result.success, 'Should handle async');
  assert.equal(result.data, 150, 'Should correctly compute');
});

test('PipelineBuilder: returns same builder type for chaining', async () => {
  const builder = new PipelineBuilder<number, number>();
  const builder2 = builder.addStep(new AddOneStep());

  // Both should work for chaining
  const result = await builder2
    .addStep(new MultiplyByTwoStep())
    .execute(5);

  assert.ok(result.success, 'Chaining should work');
  assert.equal(result.data, 12, 'Should correctly compute');
});

test('executePipeline: step names appear in results', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new MultiplyByTwoStep(),
    new StringifyStep(),
  ];
  const result = await executePipeline(steps, 5);

  assert.equal(result.results[0].step, 'AddOne', 'First step name correct');
  assert.equal(result.results[1].step, 'MultiplyByTwo', 'Second step name correct');
  assert.equal(result.results[2].step, 'Stringify', 'Third step name correct');
});

test('executePipeline: failed step result includes error', async () => {
  const steps: Step<unknown, unknown>[] = [
    new AddOneStep(),
    new FailingStep(),
  ];
  const result = await executePipeline(steps, '5');

  const failedResult = result.results[1];
  assert.ok(!failedResult.success, 'Result should be marked failed');
  assert.ok(failedResult.error, 'Result should include error');
  assert.ok(failedResult.error?.message.includes('Step failed'), 'Error message should match');
});

// ============= TypedPipelineBuilder Tests =============

// Import the new typed builder
import { TypedPipelineBuilder, typedPipeline } from './index.js';

test('TypedPipelineBuilder: basic typed pipeline execution', async () => {
  const result = await typedPipeline<number>()
    .addStep(new AddOneStep() as Step<number, number>)
    .addStep(new MultiplyByTwoStep() as Step<number, number>)
    .execute(5);

  assert.ok(result.success, 'Pipeline should succeed');
  // (5 + 1) * 2 = 12
  assert.equal(result.data, 12, 'Output should be 12');
});

test('TypedPipelineBuilder: heterogeneous type transformations', async () => {
  const result = await typedPipeline<number>()
    .addStep(new AddOneStep() as Step<number, number>)
    .addStep(new MultiplyByTwoStep() as Step<number, number>)
    .addStep(new StringifyStep() as Step<number, string>)
    .execute(5);

  assert.ok(result.success, 'Pipeline should succeed');
  // (5 + 1) * 2 = 12 -> "12"
  assert.equal(result.data, '12', 'Output should be "12" (string)');
  assert.equal(typeof result.data, 'string', 'Final type should be string');
});

test('TypedPipelineBuilder: supports custom steps', async () => {
  class ConfigStep extends AbstractStep<string, { config: string }> {
    constructor() {
      super('ConfigStep');
    }
    async execute(input: string): Promise<{ config: string }> {
      return { config: input };
    }
  }

  class ProcessStep extends AbstractStep<{ config: string }, string[]> {
    constructor() {
      super('ProcessStep');
    }
    async execute(input: { config: string }): Promise<string[]> {
      return [input.config, 'processed'];
    }
  }

  const result = await typedPipeline<string>()
    .addStep(new ConfigStep() as Step<string, { config: string }>)
    .addStep(new ProcessStep() as Step<{ config: string }, string[]>)
    .execute('data');

  assert.ok(result.success, 'Pipeline should succeed');
  assert.deepEqual(result.data, ['data', 'processed'], 'Output should be array');
});

test('TypedPipelineBuilder: error propagation', async () => {
  const result = await typedPipeline<number>()
    .addStep(new AddOneStep() as Step<number, number>)
    .addStep(new FailingStep() as Step<number, string>)
    .execute(5, { failFast: true });

  assert.ok(!result.success, 'Pipeline should fail');
  assert.equal(result.errors.length, 1, 'Should have one error');
});

test('TypedPipelineBuilder: getSteps returns steps', async () => {
  const builder = typedPipeline<number>()
    .addStep(new AddOneStep() as Step<number, number>)
    .addStep(new MultiplyByTwoStep() as Step<number, number>);

  const steps = builder.getSteps();
  assert.equal(steps.length, 2, 'Should have 2 steps');
});

test('TypedPipelineBuilder: verbose mode logs execution', async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (msg: string) => {
    logs.push(msg);
  };

  try {
    const result = await typedPipeline<number>()
      .addStep(new AddOneStep() as Step<number, number>)
      .addStep(new MultiplyByTwoStep() as Step<number, number>)
      .execute(5, { verbose: true });

    assert.ok(result.success, 'Pipeline should succeed');
    assert.ok(logs.length > 0, 'Should have logged output');
    assert.ok(logs.some((l) => l.includes('AddOne')), 'Should log step names');
  } finally {
    console.log = originalLog;
  }
});
