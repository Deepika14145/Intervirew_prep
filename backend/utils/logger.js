const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
});

// Avoid uploading credentials to git, load from .env. The user will handle AWS security.
if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.NODE_ENV === 'production' && process.env.ENABLE_CLOUDWATCH === 'true') {
    logger.add(new WinstonCloudWatch({
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP_NAME || '/intervai/backend',
        logStreamName: process.env.CLOUDWATCH_LOG_STREAM_NAME || `express-backend-${new Date().toISOString().split('T')[0]}`,
        awsRegion: process.env.AWS_REGION || 'ap-south-1',
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY
    }));
}

module.exports = logger;
