using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft.Json;
using System;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace CherryImage;

public class Function
{
    private readonly IAmazonS3 S3Client;
    private static readonly string bucketName = "cherryi";

    public Function() : this(new AmazonS3Client())
    {
    }

    public Function(IAmazonS3 s3Client)
    {
        S3Client = s3Client;
    }

    public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context)
    {
        try
        {
            switch (request.RequestContext.Http.Method.ToUpper())
            {
                case "GET":
                    if (request.RawPath.Equals("/"))
                    {
                        // List all files in the bucket
                        var fileList = await ListFilesInBucket(context);
                        return new APIGatewayHttpApiV2ProxyResponse
                        {
                            StatusCode = 200,
                            Body = JsonConvert.SerializeObject(fileList)
                        };
                    }
                    else
                    {
                        // Generate pre-signed URL for a specific file
                        var objectKey = request.PathParameters["file"];
                        var url = GeneratePreSignedURL(objectKey, context);
                        return new APIGatewayHttpApiV2ProxyResponse
                        {
                            StatusCode = 200,
                            Body = JsonConvert.SerializeObject(new { PreSignedUrl = url })
                        };
                    }

                case "POST":
                    // Upload file to bucket (assuming the file content is in the request body)
                    await UploadFileToBucket(request.Body, context);
                    return new APIGatewayHttpApiV2ProxyResponse
                    {
                        StatusCode = 200,
                        Body = "File uploaded successfully"
                    };

                default:
                    return new APIGatewayHttpApiV2ProxyResponse
                    {
                        StatusCode = 405,
                        Body = "Method Not Allowed"
                    };
            }
        }
        catch (Exception e)
        {
            context.Logger.LogLine($"Error: {e.Message}");
            return new APIGatewayHttpApiV2ProxyResponse
            {
                StatusCode = 500,
                Body = $"Internal server error: {e.Message}"
            };
        }
    }

    private async Task<List<string>> ListFilesInBucket(ILambdaContext context)
    {
        var list = new List<string>();
        var request = new ListObjectsV2Request
        {
            BucketName = bucketName,
        };
        ListObjectsV2Response response;
        do
        {
            response = await S3Client.ListObjectsV2Async(request);
            foreach (var obj in response.S3Objects)
            {
                list.Add(obj.Key);
            }
            request.ContinuationToken = response.NextContinuationToken;
        } while (response.IsTruncated);
        return list;
    }

    private string GeneratePreSignedURL(string objectKey, ILambdaContext context)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            Expires = DateTime.UtcNow.AddHours(1)
        };

        string url = S3Client.GetPreSignedURL(request);
        context.Logger.LogLine($"Generated pre-signed URL: {url}");
        return url;
    }

    private async Task UploadFileToBucket(string base64EncodedFile, ILambdaContext context)
    {
        var fileContent = Convert.FromBase64String(base64EncodedFile);
        var objectKey = Guid.NewGuid().ToString(); // Generating a unique file name; adjust as needed
        using var stream = new MemoryStream(fileContent);
        var uploadRequest = new PutObjectRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            InputStream = stream,
        };
        await S3Client.PutObjectAsync(uploadRequest);
    }
}
