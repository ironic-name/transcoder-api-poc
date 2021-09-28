import { v1 } from '@google-cloud/video-transcoder';
import queue, { QueueWorkerCallback } from 'queue';
import { JobConfiguration } from "../interfaces/JobConfiguration";
import { QueuedTranscodingJob } from '../interfaces/QueuedTranscodingJob';
import { TranscodingJob } from "../interfaces/TranscodingJob";

export default class GoogleTranscoderClient {
  concurrency = 20;
  pollInterval = 10000;

  transcoderServiceClient: v1.TranscoderServiceClient;
  projectId: string;
  projectLocation: string;

  internalQueue: Array<QueuedTranscodingJob> = [];

  // TODO: Extract this to an external queue
  q = queue({
    concurrency: this.concurrency,
    autostart: true,
  });

  debug: boolean = false;

  constructor(projectId: string, projectLocation: string) {
    this.projectId = projectId;
    this.projectLocation = projectLocation;

    this.transcoderServiceClient = new v1.TranscoderServiceClient();
  }

  queueJob(config: JobConfiguration): string {
    const key = config.outputUri;

    const existsInQueue = this.internalQueue.some(queuedJob => queuedJob.key === key);

    if (existsInQueue) {
      this.log('Job already in queue', key);
      return key;
    }

    this.internalQueue.push({
      key,
      config,
      state: 'QUEUED',
    });

    // TODO: This implementation should be on an external queueing service
    this.q.push((callback) => {
      (async (callback: QueueWorkerCallback) => {
        const queuedJob = this.internalQueue.find(queuedItem => queuedItem.key === key);

        if (!queuedJob) {
          callback(new Error("No queued job found"));
          return;
        }

        const newJob = await this.startJob(queuedJob.config);

        this.log('Started job', queuedJob.key);

        queuedJob.job = newJob;
        queuedJob.state = 'RUNNING';

        const queuePoll = setInterval(async () => {
          const currentJob = await this.fetchJob(queuedJob.job!.name!);

          queuedJob.job = currentJob;

          if (currentJob.state === 'FAILED' || currentJob.state === 'SUCCEEDED') {
            this.log('Completed job', queuedJob.key, (currentJob.endTime!.seconds! as number) - (currentJob.startTime!.seconds! as number));

            queuedJob.state = 'COMPLETE';

            clearInterval(queuePoll);
            callback(undefined, queuedJob.job!.name!);
          }
        }, this.pollInterval)
      })(callback!);
    });

    this.log('Added job', key);

    return key;
  }

  getJob(jobName: string): TranscodingJob | null {
    return this.internalQueue.find(job => job.key === jobName)?.job ?? null;
  }

  private async startJob(config: JobConfiguration): Promise<TranscodingJob> {
    const request = {
      parent: this.transcoderServiceClient.locationPath(this.projectId, this.projectLocation),
      job: {
        inputUri: config.inputUri,
        outputUri: config.outputUri,
        templateId: config.preset,
      },
    };

    const [response] = await this.transcoderServiceClient.createJob(request);

    return response as TranscodingJob;
  }

  private async fetchJob(jobName: string): Promise<TranscodingJob> {
    const jobId = jobName.split('/').reverse()[0];

    const request = {
      name: this.transcoderServiceClient.jobPath(this.projectId, this.projectLocation, jobId),
    };
    const [response] = await this.transcoderServiceClient.getJob(request);

    return response as TranscodingJob;
  }

  private log(...args: any[]) {
    if (!this.debug) return;

    console.log('TranscoderClient', ...args)
  }
}
