type JobState = "PROCESSING_STATE_UNSPECIFIED" | "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

interface ITimestamp {
  seconds?: (number | Long | string | null);
  nanos?: (number | null);
}

export interface TranscodingJob {
  name?: string | null;
  inputUri?: string | null;
  outputUri?: string | null;
  templateId?: string | null;
  config?: any;
  state?: JobState;
  createTime?: ITimestamp;
  startTime?: ITimestamp;
  endTime?: ITimestamp;
  error?: any;
}
