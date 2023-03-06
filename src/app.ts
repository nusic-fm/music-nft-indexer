require("dotenv").config();
import express, { Application, Request, Response } from "express";
import { MoralisIndexer } from "./indexer";
// import { fileDownload, getUrl, streamFileDownload } from "./services/storage";
// import https from "https";

const app: Application = express();
const moralisInstance = new MoralisIndexer();

const port = process.env.PORT;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("saulgoodman...");
});

app.get("/latest-block", (req: Request, res: Response) => {
  res.json(moralisInstance.latestBlock);
});

app.get("/block", async (req: Request, res: Response) => {
  const count = await moralisInstance.getCurrentBlock();
  res.json(count);
});
app.get("/noOfMusicNfts", async (req: Request, res: Response) => {
  const count = await moralisInstance.getMusicNftsCount();
  res.json(count);
});

app.get("/passed-blocks", async (req: Request, res: Response) => {
  const count = await moralisInstance.getPassedBlocks();
  res.json(count);
});
app.get("/init", async (req: Request, res: Response) => {
  await moralisInstance.init();
  res.send("Ok");
});
app.get("/resume", async (req: Request, res: Response) => {
  await moralisInstance.resume();
  res.send("Ok");
});

app.listen(port, async function () {
  console.log(`App is listening on port ${port} !`);
  await moralisInstance.init();
  moralisInstance.start();
  // moralisInstance.resume();
});
