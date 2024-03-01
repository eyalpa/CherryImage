using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.S3;
using Amazon.S3.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.S3.Transfer;
using System.IO;
using Newtonsoft.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

public class Function
{
    private static readonly AmazonS3Client s3Client = new AmazonS3Client();
    private const string bucketName = "cherryi";

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            var objectKey = request.QueryStringParameters != null && request.QueryStringParameters.ContainsKey("file") ? request.QueryStringParameters["file"] : "";
            switch (request.HttpMethod.ToUpper())
            {
                case "GET":
                    context.Logger.LogLine($"GET : objectKey:{objectKey} request:{JsonConvert.SerializeObject(request)}");
                    if (request.Path.EndsWith("/CherryImageNode") && string.IsNullOrEmpty(objectKey))
                    {
                        var fileList = await ListFilesInBucket();
                        return new APIGatewayProxyResponse
                        {
                            StatusCode = 200,
                            Body = JsonConvert.SerializeObject(fileList)
                        };
                    }
                    else
                    {
                        context.Logger.LogLine($"{JsonConvert.SerializeObject(request)} looking for request.PathParameters[\"file\"]");
                        var url = await GeneratePreSignedURL(objectKey);
                        return new APIGatewayProxyResponse
                        {
                            StatusCode = 200,
                            Body = JsonConvert.SerializeObject(new { PreSignedUrl = url })
                        };
                    }

                case "POST":
                    context.Logger.LogLine($"POST : objectKey:{objectKey}");
                    var decodedBody = request.IsBase64Encoded ? Convert.FromBase64String(request.Body) : System.Text.Encoding.UTF8.GetBytes(request.Body);
                    await UploadFileToBucket(objectKey, new MemoryStream(decodedBody));
                    return new APIGatewayProxyResponse
                    {
                        StatusCode = 200,
                        Body = "File uploaded successfully"
                    };

                default:
                    context.Logger.LogLine($"default : request:{JsonConvert.SerializeObject(request)}");
                    return new APIGatewayProxyResponse
                    {
                        StatusCode = 405,
                        Body = "Method Not Allowed"
                    };
            }
        }
        catch (Exception e)
        {
            context.Logger.LogLine($"Error: {e.Message}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Body = $"Internal server error: {e.Message}"
            };
        }
    }

    private async Task<List<string>> ListFilesInBucket()
    {
        var request = new ListObjectsV2Request
        {
            BucketName = bucketName
        };
        var response = await s3Client.ListObjectsV2Async(request);
        var keys = new List<string>();
        if (response.S3Objects != null)
        {
            foreach (var obj in response.S3Objects)
            {
                keys.Add(obj.Key);
            }
        }
        return keys;
    }

    private async Task<string> GeneratePreSignedURL(string objectKey)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            Expires = DateTime.UtcNow.AddHours(1)
        };
        var url = s3Client.GetPreSignedURL(request);
        return url;
    }

    private async Task UploadFileToBucket(string objectKey, Stream stream)
    {
        var transferUtility = new TransferUtility(s3Client);
        await transferUtility.UploadAsync(stream, bucketName, objectKey);
    }
}
