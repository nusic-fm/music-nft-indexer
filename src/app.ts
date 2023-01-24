require("dotenv").config();
import express, { Application, Request, Response } from "express";
import { MoralisIndexer } from "./indexer";
import { getUrl } from "./services/storage";
const https = require("https");

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

app.get("stream/:address/:id", async (req: Request, res: Response) => {
  const address = req.params.address;
  const id = req.params.id;

  const url = await getUrl(`tokens/${address}/${id}/audio/stream-url`);
  // res.json(url);
  https.get(url, (stream: any) => {
    stream.pipe(res);
  });
});

// app.get("/resume/:block", (req: Request, res: Response) => {
//   res.json(moralisInstance.latestBlock);
// });

// app.get("/stream", async (req: Request, res: Response) => {
//   const url =
//     "https://storage.googleapis.com/nusic-player.appspot.com/tokens/0xb48fc73160b1e3c77709cd275c588a049c7266b2/9/audio/stream-url?GoogleAccessId=firebase-adminsdk-m12ou%40nusic-player.iam.gserviceaccount.com&Expires=16730303400&Signature=o6NkkEI41JvnqXHtkrT1qPfm9DIw%2FB9JHmJykWMjzoyPz6edNqMWMHF0Rv4Em7QxOvyvylSKBb5UEapvTFnKsFT0ACfm2QoMAMzsGIUGCnQF4wXpiSATYLEmQt4DIhg7a3M4Blleveb8sPfevUv2tzLKKroTKMZcNLEsGvvXUqo43J8XgV3qaO7rxKUG3xfQDLDuBu7geNK%2Bq2pPcwFSb%2FrmUt%2BTnLPyb9hd5p8zqlr7tx1rMp3tImu%2FxbtN4z1ZQjwPcfvydlq3zCESxR0OAKkxE1yB%2FMPW4yRHt2kz9Uk0dIYezOO0L%2BbXKcPZlGxsLGodMSZLwBGSeR0HRIY%2FDg%3D%3D";

//   // got.stream(url).pipe(res);
//   https.get(url, (stream: any) => {
//     stream.pipe(res);
//   });
// });

app.listen(port, async function () {
  console.log(`App is listening on port ${port} !`);
  await moralisInstance.init();
  moralisInstance.start();
});
