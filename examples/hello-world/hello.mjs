import { TaskExecutor } from "@golem-sdk/task-executor";

(async function main() {
  const executor = await TaskExecutor.create("golem/alpine:latest");
  try {
    await executor.run(async (ctx) => console.log((await ctx.run("echo 'Hello World'")).stdout));
  } catch (error) {
    console.error("Computation failed:", error);
  } finally {
    await executor.shutdown();
  }
})();
