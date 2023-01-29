const admin = require("firebase-admin");
const request = require("request");
var serviceAccount = require("./nusic-player-2b3474d7e921.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE,
});

const bucket = admin.storage().bucket();

async function fetchAndUpload(
  mp3Url: string,
  objectName: string,
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    request(mp3Url)
      .pipe(
        bucket.file(objectName).createWriteStream({
          metadata: {
            contentType,
          },
        })
      )
      .on("finish", async () => {
        // const [url] = await bucket.file(objectName).getSignedUrl();
        resolve(
          `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${objectName}?alt=media`
        );
      })
      .on("error", (err: any) => {
        reject(err);
      });
  });
}

export async function getUrl(objectName: string): Promise<string> {
  try {
    const [url] = await bucket.file(objectName).getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 10,
    });
    return url;
  } catch (e: any) {
    console.log(e.message);
    return "";
  }
}

export async function streamFileDownload(objectName: string, res: any) {
  return bucket.file(objectName).createReadStream().pipe(res); //stream is created
}

export async function fileDownload(objectName: string) {
  return bucket.file(objectName).download(); //stream is created
}

export default fetchAndUpload;
