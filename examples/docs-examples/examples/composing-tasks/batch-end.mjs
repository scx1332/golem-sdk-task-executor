import { TaskExecutor, pinoPrettyLogger } from "@golem-sdk/task-executor";

(async () => {
  const executor = await TaskExecutor.create({
    package: "529f7fdaf1cf46ce3126eb6bbcd3b213c314fe8fe884914f5d1106d4",
    logger: pinoPrettyLogger(),
    yagnaOptions: { apiKey: "try_golem" },
  });

  try {
    const result = await executor.run(async (ctx) => {
      return (
        await ctx
          .beginBatch()
          .uploadFile("./worker.mjs", "/golem/input/worker.mjs")
          .run("node /golem/input/worker.mjs > /golem/input/output.txt")
          .run("cat /golem/input/output.txt")
          .downloadFile("/golem/input/output.txt", "./output.txt")
          .end()
      )[2]?.stdout;
    });

    console.log(result);
  } catch (error) {
    console.error("Computation failed:", error);
  } finally {
    await executor.shutdown();
  }
})();
