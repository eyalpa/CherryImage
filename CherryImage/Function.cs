using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.S3;
using Amazon.S3.Model;
using System;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using Amazon.S3.Util;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

public class Function
{
    private readonly IAmazonS3 _s3Client;
    private const string BucketName = "cherryi";

    public Function()
    {
        _s3Client = new AmazonS3Client();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        try
        {
            var objectKey = request.QueryStringParameters != null && request.QueryStringParameters.ContainsKey("file") ?
                            request.QueryStringParameters["file"] : string.Empty;

            switch (request.HttpMethod.ToUpper())
            {
                case "GET":
                    context.Logger.LogLine($"GET: objectKey:{objectKey}");
                    if (request.Path.EndsWith("/CherryImageNodeJS") && string.IsNullOrEmpty(objectKey))
                    {
                        var fileList = await ListFilesInBucket();
                        return new APIGatewayProxyResponse
                        {
                            StatusCode = 200,
                            Body = System.Text.Json.JsonSerializer.Serialize(fileList)
                        };
                    }
                    else
                    {
                        var url = await GeneratePreSignedURL(objectKey);
                        return new APIGatewayProxyResponse
                        {
                            StatusCode = 200,
                            Body = System.Text.Json.JsonSerializer.Serialize(new { PreSignedUrl = url })
                        };
                    }

                case "POST":
                    context.Logger.LogLine($"POST: objectKey:{objectKey}");
                    var decodedBody = Convert.FromBase64String(request.Body);
                    await UploadFileToBucket(objectKey, new MemoryStream(decodedBody));
                    return new APIGatewayProxyResponse
                    {
                        StatusCode = 200,
                        Body = "File uploaded successfully"
                    };

                default:
                    context.Logger.LogLine("Method Not Allowed");
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
        var response = await _s3Client.ListObjectsV2Async(new ListObjectsV2Request
        {
            BucketName = BucketName
        });

        return response.S3Objects != null ? response.S3Objects.ConvertAll(obj => obj.Key) : new List<string>();
    }

    private async Task<string> GeneratePreSignedURL(string objectKey)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = BucketName,
            Key = objectKey,
            Expires = DateTime.Now.AddHours(1)
        };

        return _s3Client.GetPreSignedURL(request);
    }

    private async Task UploadFileToBucket(string objectKey, MemoryStream stream)
    {
        var putRequest = new PutObjectRequest
        {
            BucketName = BucketName,
            Key = objectKey,
            InputStream = stream
        };

        await _s3Client.PutObjectAsync(putRequest);
    }
}
