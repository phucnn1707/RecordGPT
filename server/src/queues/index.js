const Queue = require('bull');

const newProductQueue = new Queue('newProductQueue', {
  redis: process.env.REDIS_QUEUE_URL ?? '127.0.0.1:6379',
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});


const max = +process.env.MAX_QUEUE_CONCURRENCY || require('os').cpus().length;

newProductQueue.process(async(params) => {
  console.log("run");
});

newProductQueue.on('global:failed', (job, err) => {
  console.log('Announce Queue JOB failed', job, err);
});

newProductQueue.on('completed', (job, result) => {
  console.log('completed');
});

module.exports = {
  newProductQueue: newProductQueue
};
