require("dotenv").config();
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const region = process.env.AWS_REGION || "ap-south-1";
const client = new DynamoDBClient({ region });

async function createTable(tableName, partitionKey) {
    const params = {
        TableName: tableName,
        KeySchema: [{ AttributeName: partitionKey, KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: partitionKey, AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };
    try {
        console.log(`Checking/Creating table: ${tableName}...`);
        await client.send(new CreateTableCommand(params));
        console.log(`✅ Table created successfully: ${tableName}`);
    } catch (error) {
        if (error.name === "ResourceInUseException") console.log(`✅ Table ${tableName} already exists.`);
        else console.error(`❌ Error creating ${tableName}:`, error.message);
    }
}

async function run() {
    await createTable(process.env.DYNAMODB_TABLE_ANSWERS || "InterviewAnswers", "answerId");
    await createTable(process.env.DYNAMODB_TABLE_INTERVIEWS || "InterviewSessions", "sessionId");
}

run();
