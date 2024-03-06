import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({});
const bucketName = "cherryi";

export const handler = async (event) => {
  try {
    const objectKey = event.queryStringParameters ? event.queryStringParameters["file"] : "";
    switch (event.requestContext.http.method.toUpperCase()) {
      case "GET":
        console.info(`GET : objectKey:${objectKey} event:${JSON.stringify(event)} `);
        if (event.requestContext.http.path.endsWith("/CherryImageNodeJS") && objectKey === "") {
          const fileList = await listFilesInBucket();
          return {
            statusCode: 200,
            body: JSON.stringify(fileList),
          };
        } else {
          console.info(`${JSON.stringify(event)} looking for event.pathParameters["file"] `);
          let requestMethod = event.queryStringParameters ? event.queryStringParameters["method"] : "GET";
          const url = await generatePreSignedURL(objectKey,requestMethod);
          return {
            statusCode: 200,
            body: JSON.stringify({ PreSignedUrl: url }),
          };
        }

      case "POST":
        console.info(`POST : objectKey:${objectKey} ,${event.isBase64Encoded} ${event.body}  `);
        let decodedBody = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
        decodedBody = extractGLTFContent(decodedBody)
        
        await uploadFileToBucket(objectKey, decodedBody);
        return {
          statusCode: 200,
          body: "File uploaded successfully",
        };

      default:
        console.info(`default : event:${JSON.stringify(event)} `);
        return {
          statusCode: 405,
          body: "Method Not Allowed",
        };
    }
  } catch (e) {
    console.error(`Error: ${e.message}`, e);
    return {
      statusCode: 500,
      body: `Internal server error: ${e.message}`,
    };
  }
};
function extractGLTFContent(content) {

    // Identify the position where "glTF" starts. 
    // This is critical as it marks the beginning of the actual file content.
    const glTFPosition = content.indexOf("glTF");

    if (glTFPosition !== -1) {
        // Convert position of "glTF" in the decoded string back to bytes to handle potential multi-byte characters
        const startPosition = content.slice(0, glTFPosition).byteLength;

        // Slice the original ArrayBuffer from "glTF" to the end
        const glTFContentArrayBuffer = content.slice(startPosition);

        return glTFContentArrayBuffer;
    } else {
        // If "glTF" is not found, log a warning and return the original ArrayBuffer
        console.warn("\"glTF\" marker not found. Returning original ArrayBuffer.");
        return content;
    }
}

async function listFilesInBucket() {
  const command = new ListObjectsV2Command({ Bucket: bucketName });
  const response = await s3Client.send(command);
  return response.Contents ? response.Contents.map((obj) => obj.Key) : [];
}

async function generatePreSignedURL(objectKey, method) {
  let command;
  if(method ==='GET'){
     command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
  }else {
    command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
  }
  
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

async function uploadFileToBucket(objectKey, blob) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: blob,
  });
  await s3Client.send(command);
}
