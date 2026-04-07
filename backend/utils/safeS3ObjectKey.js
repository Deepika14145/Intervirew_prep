/**
 * Validates that an S3 object key is safe to use in a GetObjectCommand.
 * Prevents path traversal and restricts to known prefixes.
 */
function isSafeS3ObjectKey(key) {
    if (typeof key !== 'string' || key.length === 0 || key.length > 1024) return false;
    // Block path traversal
    if (key.includes('..') || key.includes('//')) return false;
    // Only allow keys under known prefixes
    const ALLOWED_PREFIXES = ['resumes/', 'audio/'];
    return ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
}

module.exports = { isSafeS3ObjectKey };
