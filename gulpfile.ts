import gulp from "gulp";
import { createProject } from "gulp-typescript"
import { ChildProcess, spawn } from "child_process";
import { rm } from "fs";

const project = createProject("tsconfig.json");

gulp.task("default", (done) => {
  console.log("Hello world!");

  done();
});

gulp.task("build", (done) => {
  const subtasks = [
    () => {
      return new Promise<void>((resolve) => {
        console.log("Clearing old files in dist")
        rm("dist", { recursive: true }, () => {
          console.log("Finished clearing old files in dist");
          resolve();
        });
      })
    },
    () => {
      return new Promise<void>((resolve) => {
        console.log("Compiling typescript files")
        project.src()
          .pipe(project())
          .pipe(gulp.dest("dist"))
          .on("end", () => {
            console.log("Finished compiling typescript files")
            resolve();
          });
      })
    },
    () => {
      return new Promise<void>((resolve) => {
        console.log("Copying assets")
        gulp.src("src/assets/**/*")
          .pipe(gulp.dest("dist/assets"))
          .on("end", () => {
            console.log("Finished copying assets")
            resolve();
          });
      })
    },
  ];

  subtasks.reduce((prev, curr) => {
    return prev.then(curr);
  }, Promise.resolve()).then(() => {
    done();
  });
});
var nodeProcessRun: ChildProcess;
gulp.task("run", (done) => {
  if (nodeProcessRun) {
    console.log("Killing node process with PID " + nodeProcessRun.pid);
    nodeProcessRun.kill();
  }
  const node = spawn("node", ["dist/index.js"], { stdio: "inherit" });
  nodeProcessRun = node;
  console.log("Started node process with PID " + node.pid);
  done();
});

gulp.task("watch", (done) => {
  gulp.watch("src/**/*.ts", { ignoreInitial: false }, gulp.series("build", "run"));
  done();
});