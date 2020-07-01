const bunyan = require('bunyan'),
  _ = require('lodash'),
  prettyMs = require('pretty-ms'),
  bunyanFormat = require('bunyan-format')({outputMode: 'short'});

const logger = module.exports = bunyan.createLogger({
  name: require('./package').name,
  stream: bunyanFormat,
  level: process.env.loglevel
});

async function logStep(logOpts, fn) {
  const logOptsWithoutMetadata = _.omit(logOpts, 'step', 'level'),
    {step, level = 'info'} = logOpts;
  logger[level](logOptsWithoutMetadata, `Starting ${step}`);

  function logProgress(logOpts) {
    logger[level]({...logOpts, ...getDurationStats()}, `In progress: ${step}`);
  }

  const startTime = new Date();

  function getDurationStats() {
    const endTime = new Date(),
      durationMs = endTime - startTime;

    return {durationMs, prettyDuration: prettyMs(durationMs)};
  }
    
  let logOptsAdditions;
  const returnVal = await fn(logProgress, additionalLogData => {
    logOptsAdditions = additionalLogData; 
  });

  logger[level](
    {...logOptsWithoutMetadata, ...logOptsAdditions, ...getDurationStats()}, 
    `Completed ${step}`
  );

  return returnVal;
}

module.exports.logStep = logStep;