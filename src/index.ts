import bunyan from 'bunyan';
import _ from 'lodash';
import prettyMs from 'pretty-ms';
import bunyanFormat from 'bunyan-format';

const format = bunyanFormat({outputMode: 'short'});

export type LogMetadata = {
  level?: bunyan.LogLevelString
} & Record<string, unknown>;

export type LogPhaseMetadata = {phase: string} & LogMetadata;
export type PhaseFunction<T> = (
  logProgress: (metadata: Record<string, unknown>, label?: string) => void, 
  setAdditionalLogData: (extraDataToSet: Record<string, unknown>) => void) => Promise<T>; 

export type NTHLogger = {
  logPhase<T>(logOpts: LogPhaseMetadata, fn: PhaseFunction<T>): Promise<T>;
} & ReturnType<typeof bunyan.createLogger>;

export default function createLogger(opts: Parameters<typeof bunyan.createLogger>[0]): NTHLogger {
  const logger = bunyan.createLogger({
    stream: format,
    // Assume the user passed a valid loglevel.
    level: process.env.loglevel as bunyan.LogLevelString,
    ...opts
  }) as NTHLogger;

  logger.info();

  async function logPhase<T>(logOpts: LogPhaseMetadata, fn: PhaseFunction<T>) {
    const logOptsWithoutMetadata = _.omit(logOpts, 'phase', 'level'),
      {phase, level = 'info'} = logOpts;
    logger[level](logOptsWithoutMetadata, `Starting ${phase}`);

    const startTime = new Date();

    function getDurationStats() {
      const endTime = new Date(),
        durationMs = endTime.valueOf() - startTime.valueOf();
  
      return {durationMs, prettyDuration: prettyMs(durationMs)};
    }
  
    function logProgress(logOpts: Record<string, unknown>) {
      logger[level]({...logOpts, ...getDurationStats()}, `In progress: ${phase}`);
    }
  
    let logOptsAdditions: Record<string, unknown> | undefined;
    const returnVal = await fn(logProgress, additionalLogData => {
      logOptsAdditions = additionalLogData; 
    });
  
    logger[level](
      {...logOptsWithoutMetadata, ...logOptsAdditions, ...getDurationStats()}, 
      `Completed ${phase}`
    );
  
    return returnVal;
  }

  // TODO: if you call logger.child(), then logPhase is no longer present.

  return Object.assign(logger, {logPhase});
}

type LogEntry = {
  hostname: string;
  pid: number;
  time: Date;
  durationMs: number;
  prettyDuration: string;
} & Record<string, unknown>;

export function constantizeLogEntryForTest(logEntry: LogEntry): LogEntry {
  return {
    ..._.omit(logEntry, 'pid', 'hostname', 'time', 'durationMs', 'prettyDuration'),
    // It's over 9000.
    pid: 9001,
    
    durationMs: 117,
    prettyDuration: '<duration placeholder>',

    hostname: '<hostname placeholder>',
    time: new Date('2012'),
  }
}
