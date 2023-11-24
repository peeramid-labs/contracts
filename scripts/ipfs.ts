// const ipfsClient = require("ipfs-http-client");
import ipfsClient, { globSource } from "ipfs-http-client";
const projectId = process.env.IPFS_ID;
const projectSecret = process.env.IPFS_SECRET;
const auth =
  "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

const client = ipfsClient.create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

// client.pin.add("QmeGAVddnBSnKc1DLE7DLV9uuTqo5F7QbaveTjr45JUdQn").then((res) => {
//   console.log(res);
// });

export const upload2IPFS = async (file: Buffer) => {
  const res = await client.add(file);
  console.log(res);
  return res;
};

export const uploadDir2IPFS = async (path: string) => {
  console.log("path: ", path);
  for await (const file of client.addAll(globSource(`./${path}`, "**/*"))) {
    console.log(file);
  }
};
export const publish = async (value: string) => {
  const res = await client.name.publish(value);
  console.log(res);
  return res;
};

export default upload2IPFS;
