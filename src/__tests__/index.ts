import createLog from '..';
import {Writable} from 'stream';
import getStream from 'get-stream';

const wait = (timeMs: number) => new Promise(resolve => setTimeout(resolve, timeMs));

// I'm ok with magic numbers in a test.
/* eslint-disable no-magic-numbers */

it('logger', async () => {
  let output = '';
  const stream = new Writable({
    write: (chunk, _encoding, next) => {
      output += chunk.toString();
      next();
    }
  });

  const logger = createLog({name: 'test-log', stream});
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

  expect(output).toMatchSnapshot();
});