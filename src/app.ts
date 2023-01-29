require("dotenv").config();
import express, { Application, Request, Response } from "express";
import { MoralisIndexer } from "./indexer";
import { fileDownload, getUrl, streamFileDownload } from "./services/storage";
import https from "https";

const app: Application = express();
const moralisInstance = new MoralisIndexer();

const port = process.env.PORT;

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("saulgoodman...");
});

app.get("/block", (req: Request, res: Response) => {
  res.json(moralisInstance.latestBlock);
});

app.listen(port, async function () {
  console.log(`App is listening on port ${port} !`);
  await moralisInstance.init();
  moralisInstance.start();
  // moralisInstance.resume();
});
