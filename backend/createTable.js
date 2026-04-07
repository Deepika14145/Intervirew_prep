require("dotenv").config();
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const region = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region });

async function createTable() {
    const tableName = process.env.DYNAMODB_TABLE_USERS || "UsersProfile";
    
    const params = {
        TableName: tableName,
        KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" }  // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" } // String type
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    try {
        console.log(`Checking/Creating table: ${tableName} in region ${region}...`);
        const command = new CreateTableCommand(params);
        const response = await client.send(command);
        console.log("Table created successfully:\n", response.TableDescription.TableName);
    } catch (error) {
        if (error.name === "ResourceInUseException") {
            console.log(`Table ${tableName} already exists.`);
        } else {
            console.error("Error creating table:", error);
        }
    }
}

createTable();
