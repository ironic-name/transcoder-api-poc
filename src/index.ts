import { writeFileSync } from 'fs';
import path from 'path';
import config from './config/config';
import { JobConfiguration } from "./interfaces/JobConfiguration";
import { TranscodingJob } from "./interfaces/TranscodingJob";
import GoogleTranscoderClient from './services/transcoder-client';
import { sleep } from './util/sleep';

const activeJobs: { [key: string]: TranscodingJob | null } = {};

const client: GoogleTranscoderClient = new GoogleTranscoderClient(config.gcp.projectId, config.gcp.region);
client.debug = true;

async function attemptCreatingJobs() {
  const jobsToCreate: Array<JobConfiguration> = [];

  for (let i = 0; i < 50; i++) {
    jobsToCreate.push({
      inputUri: `gs://${config.gcp.bucketName}/input/${config.media.inputFileName}`,
      outputUri: `gs://${config.gcp.bucketName}/output/job-${i}/`,
      preset: 'preset/web-hd',
    });
  }

  for (const prospectiveJob of jobsToCreate) {
    try {
      const jobName = client.queueJob(prospectiveJob);

      activeJobs[jobName] = null;
    } catch (error) {
      console.error('Failed to create job', error);
    }
  }

  await sleep(1000);

  // Poll job status until all complete
  let allJobsCompleted = false;

  while (!allJobsCompleted) {
    for (const jobName of Object.keys(activeJobs)) {
      activeJobs[jobName] = client.getJob(jobName);
    }

    allJobsCompleted = Object.keys(activeJobs)
      .every(jobName => ['SUCCEEDED', 'FAILED'].includes(activeJobs[jobName]?.state ?? ''))

    await sleep(1000);
  }

  writeFileSync(path.resolve(process.cwd(), './output/results.json'), JSON.stringify(activeJobs, null, 2));
};

attemptCreatingJobs()
  .then(() => console.log('Done'))
  .catch((error) => console.error('Failed', error));