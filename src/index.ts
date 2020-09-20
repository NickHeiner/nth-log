import bunyan from 'bunyan';
import _ from 'lodash';
import prettyMs from 'pretty-ms';
import bunyanFormat from 'bunyan-format';
import Logger from 'bunyan';

const format = bunyanFormat({outputMode: 'short'});

export type LogMetadata = {
  level?: Logger.LogLevelString
} & Object;

export type LogPhaseMetadata = {step: string} & LogMetadata;
export type PhaseFunction<T> = (
  logProgress: (metadata: Object) => void, 
  setAdditionalLogData: (extraDataToSet: Object) => void) => Promise<T>; 

export type NTHLogger = {
  logPhase<T>(logOpts: LogPhaseMetadata, fn: PhaseFunction<T>): Promise<T>;
} & ReturnType<typeof bunyan.createLogger>;

export default function createLogger(opts: Parameters<typeof bunyan.createLogger>[0]): NTHLogger {
  const logger = bunyan.createLogger({
    stream: format,
    // Assume the user passed a valid loglevel.
    level: process.env.loglevel as Logger.LogLevelString,
    ...opts
  }) as NTHLogger;

  logger.info();

  async function logPhase<T>(logOpts: LogPhaseMetadata, fn: PhaseFunction<T>) {
    const logOptsWithoutMetadata = _.omit(logOpts, 'step', 'level'),
      {step, level = 'info'} = logOpts;
    logger[level](logOptsWithoutMetadata, `Starting ${step}`);
  
    function logProgress(logOpts: Object) {
      logger[level]({...logOpts, ...getDurationStats()}, `In progress: ${step}`);
    }
  
    const startTime = new Date();
  
    function getDurationStats() {
      const endTime = new Date(),
        durationMs = endTime.valueOf() - startTime.valueOf();
  
      return {durationMs, prettyDuration: prettyMs(durationMs)};
    }
      
    let logOptsAdditions: Object | undefined;
    const returnVal = await fn(logProgress, additionalLogData => {
      logOptsAdditions = additionalLogData; 
    });
  
    logger[level](
      {...logOptsWithoutMetadata, ...logOptsAdditions, ...getDurationStats()}, 
      `Completed ${step}`
    );
  
    return returnVal;
  }

  return Object.assign(logger, {logPhase});
}
