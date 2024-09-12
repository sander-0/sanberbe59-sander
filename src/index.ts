import express from "express";
import db from "./utils/database";
import routes from "./routes/api";
import bodyParser from "body-parser";
import docs from "./docs/route";
import {
  errorNotFoundMiddleware,
  errorServerMiddleware,
} from "./middlewares/error.middleware";


const PORT = 3000;

async function init() {
  try {
    await db();

    const app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use("/api", routes);

    // Inisialisasi Swagger UI
    docs(app);

    app.use(errorNotFoundMiddleware);
    app.use(errorServerMiddleware);

    // http://localhost:3000/api

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

init();
