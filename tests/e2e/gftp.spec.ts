import { TaskExecutor } from "../../src";
import fs from "fs";

describe("GFTP transfers", function () {
  it(
    "should upload and download big files simultaneously",
    async () => {
      const executor = await TaskExecutor.create({
        package: "golem/alpine:latest",
      });

      executor.onActivityReady(async (ctx) => {
        const sourcePath = fs.realpathSync(__dirname + "/../fixtures/eiffel.blend");
        await ctx.uploadFile(sourcePath, "/golem/work/eiffel.blend");
      });

      const data = [0, 1, 2, 3, 4, 5];

      const futureResults = data.map((frame) =>
        executor.run(async (ctx) => {
          const result = await ctx
            .beginBatch()
            .run("ls -Alh /golem/work/eiffel.blend")
            .downloadFile(`/golem/work/eiffel.blend`, `copy_${frame}.blend`)
            .end()
            .catch((error) => console.error(error.toString()));
          return result ? `copy_${frame}.blend` : "";
        }),
      );
      const results = await Promise.all(futureResults);

      const expectedResults = data.map((d) => `copy_${d}.blend`);

      for (const result of results) {
        expect(expectedResults).toContain(result);
      }

      for (const file of expectedResults) {
        expect(fs.existsSync(file)).toEqual(true);
      }

      await executor.shutdown();
    },
    1000 * 240,
  );
});
