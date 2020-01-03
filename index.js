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
  const logOptsWithoutStep = _.omit(logOpts, 'step'),
    step = logOpts.step;
  logger.info(logOptsWithoutStep, `Starting ${step}`);

  function logProgress(logOpts) {
    logger.info({...logOpts, ...getDurationStats()}, `In progress: ${step}`);
  }

  const startTime = new Date();

  function getDurationStats() {
    const endTime = new Date(),
      durationMs = endTime - startTime;

    return {durationMs, prettyDuration: prettyMs(durationMs)};
  }
    
  const returnVal = await fn(logProgress);

  logger.info(
    {...logOptsWithoutStep, ...getDurationStats(), ...logOpts}, 
    `Completed ${step}`
  );

  return returnVal;
}

module.exports.logStep = logStep;