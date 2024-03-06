using Amazon.S3;
using Amazon.S3.Model;
using System.Text;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

// Lambda entry point
public class Function
{
    private static readonly AmazonS3Client s3Client = new AmazonS3Client();
    private const string bucketName = "cherryi";

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            string objectKey = request.QueryStringParameters?["file"] ?? "";
            switch (request.HttpMethod.ToUpper())
            {
                case "GET":
                    context.Logger.LogLine($"GET : objectKey:{objectKey} event:{request}");
                    if (request.Path.EndsWith("/CherryImage") && string.IsNullOrEmpty(objectKey))
                    {
                        var fileList = await ListFilesInBucketAsync();
                        return CreateResponse(200, fileList);
                    }
                    else
                    {
                        string requestMethod = request.QueryStringParameters?["method"] ?? "GET";
                        var url = GeneratePreSignedURL(objectKey, requestMethod);
                        return CreateResponse(200, new { PreSignedUrl = url });
                    }

                case "POST":
                    context.Logger.LogLine($"POST : objectKey:{objectKey}, {request.IsBase64Encoded} {request.Body}");
                    byte[] decodedBody = request.IsBase64Encoded ? Convert.FromBase64String(request.Body) : Encoding.UTF8.GetBytes(request.Body);
                    var gltfContent = ExtractGLTFContent(decodedBody);
                    await UploadFileToBucketAsync(objectKey, gltfContent);
                    return CreateResponse(200, "File uploaded successfully");

                default:
                    context.Logger.LogLine($"Default : event:{request}");
                    return CreateResponse(405, "Method Not Allowed");
            }
        }
        catch (Exception e)
        {
            context.Logger.LogLine($"Error: {e.Message}");
            return CreateResponse(500, $"Internal server error: {e.Message}");
        }
    }

    private static APIGatewayProxyResponse CreateResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = System.Text.Json.JsonSerializer.Serialize(body),
            Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } }
        };
    }

    private static byte[] ExtractGLTFContent(byte[] content)
    {
        string contentAsString = Encoding.UTF8.GetString(content);
        int glTFPosition = contentAsString.IndexOf("glTF");
        if (glTFPosition != -1)
        {
            return content[glTFPosition..];
        }
        else
        {
            Console.WriteLine("\"glTF\" marker not found. Returning original content.");
            return content;
        }
    }

    private static async Task<IEnumerable<string>> ListFilesInBucketAsync()
    {
        var response = await s3Client.ListObjectsV2Async(new ListObjectsV2Request { BucketName = bucketName });
        return response.S3Objects?.ConvertAll(obj => obj.Key) ?? new List<string>();
    }

    private static string GeneratePreSignedURL(string objectKey, string method)
    {
        var request = method.ToUpper() == "GET" ? new GetPreSignedUrlRequest { BucketName = bucketName, Key = objectKey, Verb = HttpVerb.GET, Expires = DateTime.UtcNow.AddHours(1) } :
                                                    new GetPreSignedUrlRequest { BucketName = bucketName, Key = objectKey, Verb = HttpVerb.PUT, Expires = DateTime.UtcNow.AddHours(1) };
        return s3Client.GetPreSignedURL(request);
    }

    private static async Task UploadFileToBucketAsync(string objectKey, byte[] content)
    {
        var request = new PutObjectRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            InputStream = new MemoryStream(content),
        };
        await s3Client.PutObjectAsync(request);
    }
}
