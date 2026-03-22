const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { PollyClient } = require('@aws-sdk/client-polly');

const region = process.env.AWS_REGION || "us-east-1";

// AWS Credentials will be picked automatically if running on EC2/Lambda 
// or loaded from .env for local testing. (User's instruction: no technical privacy issues embedded)
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const pollyClient = new PollyClient({ region });

// DocumentClient simplifies interaction with DynamoDb (allows using native JS objects)
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

module.exports = {
    s3Client,
    dynamoDocClient,
    pollyClient,
};
