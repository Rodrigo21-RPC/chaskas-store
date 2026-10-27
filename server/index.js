import { readConfig } from "./config.js";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
try {
  const config = readConfig();
  const db = openDatabase(config.databasePath);
  const server = createApp({ config, db }).listen(config.port, () =>
    console.log(`Chaska's Store disponible en el puerto ${config.port}.`),
  );
  let stopping = false;
  function stop() {
    if (stopping) return;
    stopping = true;
    server.close(() => {
      db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  }
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
