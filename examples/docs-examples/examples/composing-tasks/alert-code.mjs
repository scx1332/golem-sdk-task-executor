import { TaskExecutor, pinoPrettyLogger } from "@golem-sdk/task-executor";
(async () => {
  const executor = await TaskExecutor.create({
    package: "529f7fdaf1cf46ce3126eb6bbcd3b213c314fe8fe884914f5d1106d4",
    logger: pinoPrettyLogger(),
    yagnaOptions: { apiKey: "try_golem" },
  });

  try {
    const result = await executor.run(async (ctx) => {
      const res = await ctx
        .beginBatch()
        .uploadFile("./worker.mjs", "/golem/input/worker.mjs")
        .run("node /golem/input/worker.mjs > /golem/input/output.txt")
        .run("cat /golem/input/output.txt")
        .downloadFile("/golem/input/output.txt", "./output.txt")
        .endStream();

      for await (const chunk of res) {
        if (chunk.index === 2) console.log(chunk.stdout);
      }
    });
  } catch (err) {
    console.error("Task encountered an error:", err);
  } finally {
    await executor.shutdown();
  }
})();
