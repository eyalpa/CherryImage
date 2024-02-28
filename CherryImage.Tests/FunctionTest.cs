using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;
using Moq;
using NUnit.Framework;
using System;
using CherryImage;
using NUnit.Framework.Legacy; // Ensure this is using your actual namespace

namespace CherryImage.Tests
{
    [TestFixture]
    public class FunctionTests
    {
        private Mock<IAmazonS3> mockS3Client;
        private Mock<ILambdaContext> mockLambdaContext;
        private Function function;

        [SetUp]
        public void Setup()
        {
            // Initialize the mocks
            mockS3Client = new Mock<IAmazonS3>();
            mockLambdaContext = new Mock<ILambdaContext>();

            // Setup the mock behavior for the logger to avoid null reference exceptions
            mockLambdaContext.Setup(x => x.Logger).Returns(new Mock<ILambdaLogger>().Object);

            // Initialize the function with the mocked S3 client
            function = new Function(mockS3Client.Object);
        }

        [Test]
        public void FunctionHandler_ReturnsPreSignedUrl_WithValidObjectKey()
        {
            // Arrange
            var objectKey = "testKey";
            var expectedUrl = "https://example.com/presigned-url";
            var request = new APIGatewayHttpApiV2ProxyRequest
            {
                QueryStringParameters = new Dictionary<string, string> { { "objectKey", objectKey } }
            };
            mockS3Client.Setup(s3 => s3.GetPreSignedURL(It.IsAny<GetPreSignedUrlRequest>()))
                        .Returns(expectedUrl);

            // Act
            var response = function.FunctionHandler(request, mockLambdaContext.Object);

            // Assert
            Assert.Equals(200, response.StatusCode); // Ensure the status code is 200
            StringAssert.Contains(expectedUrl, response.Body); // Check if the expected URL is in the response body
            mockLambdaContext.Verify(ctx => ctx.Logger.LogLine(It.IsAny<string>()), Times.AtLeastOnce);
        }

        [Test]
        public void FunctionHandler_ThrowsException_WhenS3ClientFails()
        {
            // Arrange
            var objectKey = "testKey";
            var request = new APIGatewayHttpApiV2ProxyRequest
            {
                QueryStringParameters = new Dictionary<string, string> { { "objectKey", objectKey } }
            };
            mockS3Client.Setup(s3 => s3.GetPreSignedURL(It.IsAny<GetPreSignedUrlRequest>()))
                        .Throws(new Exception("S3 Error"));

            // Act & Assert
            var response = function.FunctionHandler(request, mockLambdaContext.Object);
            Assert.Equals(500, response.StatusCode); // Verify that the status code is 500 for errors
            StringAssert.Contains("Internal server error", response.Body); // Check if the response body contains the error message
        }
    }
}
