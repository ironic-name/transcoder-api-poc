import { JobConfiguration } from "./JobConfiguration";
import { TranscodingJob } from "./TranscodingJob";

export interface QueuedTranscodingJob {
  key: string;
  state: 'QUEUED' | 'RUNNING' | 'COMPLETE';
  config: JobConfiguration;
  job?: TranscodingJob;
}
