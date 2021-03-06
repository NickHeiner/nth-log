import createLog, {constantizeLogEntryForTest} from '..';
import {RingBuffer} from 'bunyan';

// I may come to regret having this test directly in TS, as opposed to building the JS and then running the tests on 
// that. But I think this will give a smoother dev experience.

const wait = (timeMs: number) => new Promise(resolve => setTimeout(resolve, timeMs));

// I'm ok with magic numbers in a test.
/* eslint-disable no-magic-numbers */

it('logger', async () => {
  const ringBuffer = new RingBuffer({limit: 100});
  const logger = createLog({
    name: 'test-log', 
    streams: [{
      level: 'trace',
      type: 'raw',
      stream: ringBuffer
    }],
    stream: undefined
  });
  logger.trace({dataEntry: 'data value trace'}, 'String label');
  logger.debug({dataEntry: 'data value debug'}, 'String label');
  logger.info({dataEntry: 'data value info'}, 'String label');
  logger.warn({dataEntry: 'data value warn'}, 'String label');
  logger.error({dataEntry: 'data value error'}, 'String label');
  logger.fatal({dataEntry: 'data value fatal'}, 'String label');

  await logger.logPhase({phase: 'phase name'}, async (logProgress, setAdditionalLogMetadata) => {
    await wait(10);
    logProgress({substep: 1}, 'First wait complete');
    await wait(10);
    logProgress({substep: 2}, 'Second wait complete');
    setAdditionalLogMetadata({additional: 'metadata'});
  });

  const child = logger.child({childOpt: 'child value'});

  await child.logPhase({phase: 'child phase name'}, () => wait(10));

  expect(ringBuffer.records.map(record => constantizeLogEntryForTest(record))).toMatchSnapshot();
});