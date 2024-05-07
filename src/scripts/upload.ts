import axios, { AxiosProgressEvent } from "axios";
import { progressHanler } from "./utils";

const uploadURL = "http://localhost:4000/api/v1/videos";

let chunkListenerList: {
  chunk: Blob;
  chunkNumber: number;
  percentage: number;
}[] = [];

let file: Blob;

/**
 * Send chunk of file Blob to the server
 * @param {Blob} chunk - Blob to send
 * @param {string} filename - video ID
 * @param {number} chunkNumber - index of chunk
 * @param {number} retries - number of retries for failed upload
 */
async function uploadChunk(
  chunk: Blob,
  filename: string,
  chunkNumber: number,
  updater: (val: number) => void,
  retries: number = 3
) {
  const formData = new FormData();
  formData.append("file", chunk, `${chunkNumber}`);

  try {
    await axios.post(`${uploadURL}/upload/${filename}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: createProgressHandler(
        chunkNumber,
        file,
        updater,
        uploadPercentage
      ),
    });
  } catch (error) {
    if (retries > 0) {
      await uploadChunk(chunk, filename, chunkNumber, updater, retries - 1);
    } else {
      console.error("Failed to upload chunk: " + chunkNumber, error);
      throw new Error("Failed to upload chunk");
    }
  }
}

/**
 * Start uploading of file to server
 * @param {Blob} blob - file to upload
 * @param retries - number of times to retry upload
 * @returns {Promise<string>}
 */
export async function uploadFile(
  blob: Blob,
  chunkSize = 6_000_000
): Promise<string> {
  const video_id = await requestUploadUrl();
  if (!video_id) {
    throw new Error("can't start upload");
  }
  let start = 0;

  try {
    const chunkList = [];
    file = blob;
    /**
     * Slice up file into chunks of size { chunkSize }
     */
    while (start < blob.size) {
      const chunk = blob.slice(start, Math.min(start + chunkSize, file.size));
      const chunkNumber = Math.ceil(start / chunkSize);
      chunkList.push({ chunk, chunkNumber });
      start += chunkSize;
    }
    /**
     *
     */
    chunkListenerList = chunkList.map(({ chunk, chunkNumber }) => {
      return { chunk, chunkNumber, percentage: 0 };
    });

    const progress = progressHanler(0, 100);
    /**
     * Sent chunks to the server concorrently.
     */
    const requestList = chunkList.map(({ chunk, chunkNumber }) =>
      uploadChunk(chunk, video_id, chunkNumber, progress.update, 2)
    );

    document.body.append(progress.ui);
    /**
     * Await upload of all chunks to the sever to be completed
     */
    await Promise.all(requestList);

    /**
     * request for server to merge chunks
     */
    const response = await mergeChunks(video_id, chunkSize);

    if (response.ok) {
      const { video_id } = await response.json();
      return video_id;
    } else {
      throw new Error("Error Merging chunks");
    }
  } catch (error) {
    throw new Error("Error uploading");
  }
}

/**
 * Fetches and returns ID for video video
 * @returns { Promise<string> }
 */
async function requestUploadUrl(retries = 2): Promise<string> {
  try {
    const response = await fetch(`${uploadURL}/create-file-upload-link`);
    const data = await response.json();
    return data.video_id as string;
  } catch (error) {
    if (retries > 0) {
      return await requestUploadUrl(retries - 1);
    }
    throw new Error("Failed to create file upload link");
  }
}

/**
 * Assemble video chunks on the server
 * @param {string} video_id - Id of the video to be merged together
 * @param {number} chunkSize - chunk Size for each slide of the video
 * @returns {Promise<Response>}
 */
async function mergeChunks(
  video_id: string,
  chunkSize: number = 6_000_000
): Promise<Response> {
  try {
    return fetch(`${uploadURL}/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ video_id, chunkSize }),
    });
  } catch (error) {
    throw new Error(`Failed to merge video`);
  }
}

function uploadPercentage(
  file: Blob,
  data: typeof chunkListenerList,
  updater: (progress: number) => void
) {
  if (!file || !data.length) return;
  const loaded = data
    .map(({ chunk, percentage }) => chunk.size * percentage)
    .reduce((acc: number, cur: number) => acc + cur);
  updater(parseInt((loaded / file.size).toFixed(2)));
  // return parseInt((loaded / file.size).toFixed(2));
}

function createProgressHandler(
  item: number,
  file: Blob,
  updater: (progress: number) => void,
  callback: (
    file: Blob,
    data: typeof chunkListenerList,
    cb: (progress: number) => void
  ) => void
) {
  return (e: AxiosProgressEvent) => {
    if (e.total) {
      chunkListenerList[item].percentage = parseInt(
        String((e.loaded / e.total) * 100)
      );
      callback(file, chunkListenerList, updater);
    }
  };
}
