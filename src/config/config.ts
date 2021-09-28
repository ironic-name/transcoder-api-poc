import dotenv from 'dotenv';
dotenv.config({
  debug: true,
});

const config = {
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || '',
    region: process.env.GCP_REGION || '',
    bucketName: process.env.GCP_BUCKET_NAME || '',
  },
  media: {
    inputFileName: 'ChromeCast.mp4'
  }
}

export default config;