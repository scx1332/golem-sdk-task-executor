import { TaskExecutor, pinoPrettyLogger } from "@golem-sdk/task-executor";

(async () => {
  const executor = await TaskExecutor.create({
    package: "dcd99a5904bebf7ca655a833b73cc42b67fd40b4a111572e3d2007c3",
    logger: pinoPrettyLogger(),
    yagnaOptions: { apiKey: "try_golem" },
  });

  try {
    const result = await executor.run(async (ctx) => {
      const res = await ctx
        .beginBatch()
        .run("ls -l /golem > /golem/work/output.txt")
        .run("cat /golem/work/output.txt")
        .downloadFile("/golem/work/output.txt", "./output.txt")
        .end();

      return res[2]?.stdout;
    });

    console.log(result);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await executor.shutdown();
  }
})();
