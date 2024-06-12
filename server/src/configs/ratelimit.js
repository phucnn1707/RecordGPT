const { RateLimiterMemory } = require('rate-limiter-flexible');

exports.defaultLimiter = new RateLimiterMemory({
    points: +process.env.RATE_LIMIT || 300,
    duration: 60,
});

exports.loginLimiter = new RateLimiterMemory({
    points: 5,
    duration: 15 * 60, // 15 minutes, 5 login
});

exports.anonymousCreationLimiter = new RateLimiterMemory({
    points: 10,
    duration: 3 * 3600,
});