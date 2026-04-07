require("dotenv").config();
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

async function createUsersTable() {
    const params = {
        TableName: "InterviewUsers",
        KeySchema: [
            { AttributeName: "email", KeyType: "HASH" } // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "email", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    try {
        console.log("Attempting to create DynamoDB table: InterviewUsers...");
        const data = await client.send(new CreateTableCommand(params));
        console.log("✅ Success! Table created successfully.");
    } catch (err) {
        if (err.name === "ResourceInUseException") {
            console.log("✅ Table 'InterviewUsers' already exists!");
        } else {
            console.error("❌ Error creating table:", err.message);
        }
    }
}

createUsersTable();
