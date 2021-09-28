# Google Transcoder API POC

This is a rough proof of concept for managing the transcoding of a video for the purposes of serving transcoded media. This roughly follows the [Quickstart](https://cloud.google.com/transcoder/docs/quickstart) document offered by Google.

> Note. This is not meant to be a production ready implementation. Extracting the queue service currently defined in the transcoder client is recommended

## Getting set up

1. To start off, you'll need to create a new project. Creating a new project allows you to delete the project once you're done to remove any non required resources.
2. Once you've created and selected your project on GCP, make sure that you've enabled billing for your project
3. In GCP, under APIs & Services view, click "Enable APIs and Services" and then search for and enable the "Transcoder API" for the project
4. Create a service account with the role "Transcoder > Transcoder Admin"
5. Create a service account key for the service account just created and save the JSON file to a safe location on your machine
6. Create a new standard cloud storage bucket with a unique name
7. Create a new folder called "input" in the bucket
8. Upload the file available [here](https://cloud.google.com/transcoder/images/ChromeCast.mp4) and upload it in the input folder just created, without changing the filename
9. In the root this project, create a `.env` file with the following content:

```
GCP_PROJECT_ID="<<Your project ID for the project created in step 1>>"
GCP_REGION="<<Your project's region>>"
GCP_BUCKET_NAME="<<The bucket name from step 6>>"
GOOGLE_APPLICATION_CREDENTIALS="<<The absolute filepath to the .json file from step 5>>"
```

## Running the POC

Once you've set up all the GCP dependencies, you can go ahead and run the POC like so:

1. Install dependencies: `npm i`
2. Run the index.ts scripts: `npm start`

Once you've done this, you should see some console output showing when a job has been added to the queue, and when it's started and completed.

Once all jobs have completed, a .json representation of all jobs will be written to `./output/results.json`. In this file you can see the structure of a transcoding job.

> Note: You can't have more than 20 transcoding jobs running simultaneously, thus a queueing mechanism is required. In the transcoder client in this POC, there's a rudimentary local queue set up to handle any new jobs. These are all stored in memory and are thus unreliable for production.
>
> I would recommend using a service like GCP Pub/Sub, with proper concurrency handling to ensure you're not processing more than 20 jobs at an instant.
