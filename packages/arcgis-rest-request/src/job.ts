/* Copyright (c) 2022-2023 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
import { request } from "./request.js";
import { cleanUrl } from "./utils/clean-url.js";
import { IRequestOptions, JOB_STATUSES } from "./index.js";
import mitt from "mitt";


/**
 *
 * You should **never** set a default `authentication` when you are in a server side environment where you may be handling requests for many different authenticated users.
 *
 * @param options The default options to pass with every request. Existing default will be overwritten.
 */

interface IJobOptions extends IRequestOptions {
  id?: string;
  url?: string;
  params?: any;
  startMonitoring?: boolean;
  pollingRate?: number;
  authentication?: string;
}
type ISubmitJobOptions = Omit<IJobOptions, "id">;

export class Job {
  pollingRate: number;
  readonly url: string;
  readonly id: string;
  readonly resultParams: any;
  readonly authentication: any;

  static id: any;
  static authentication: string;
  static jobUrl: string;
  static cancelJobRequest: string;

  emitter: any;

  private didUserEnableMonitoring: any;
  private setIntervalHandler: any;

  constructor(options: any) {
    this.url = options.url; //user passes in the initial endpoint
    this.id = options.id; //saved from the response from the static create job
    this.pollingRate = options.pollingRate || 5000;
    this.emitter = mitt(); //interval between each polling request
    this.authentication = options.authentication;

    if (options.startMonitoring) {
      this.startEventMonitoring();
    }
  }

  private get jobUrl() {
    return this.url + `/jobs/${this.id}`;
  }

  get isMonitoring() {
    return !!this.setIntervalHandler;
  }


  getJobInfo() {
    return request(this.jobUrl, {
      authentication: this.authentication
    });
  }

  static fromExistingJob(options: IJobOptions) {
    return new Job(options);
  }

  //submits a new job
  static submitJob(requestOptions: ISubmitJobOptions) {
    const { url, params, startMonitoring, pollingRate, authentication } =
    requestOptions;
    const baseUrl = cleanUrl(url.replace(/\/submitJob\/?/, ""));
    const submitUrl = baseUrl + "/submitJob";
    return request(submitUrl, { params, authentication }).then(
      (response) =>
        new Job({
          url: baseUrl,
          authentication: authentication,
          id: response.jobId,
          startMonitoring,
          pollingRate
        })
    );
  }

  //this is an internal polling event listener for every status that is emitted from the REST endpoint
  private executePoll = async () => {
    let result;
    try {
      result = await this.getJobInfo();
    } catch (error) {
      this.emitter.emit(JOB_STATUSES.Error, error);
      return;
    }
    this.emitter.emit(JOB_STATUSES.Status, result);

    switch (result.jobStatus) {
      case "esriJobCancelled":
        this.emitter.emit(JOB_STATUSES.Cancelled, result);
        break;
      case "esriJobCancelling":
        this.emitter.emit(JOB_STATUSES.Cancelling, result);
        break;
      case "esriJobNew":
        this.emitter.emit(JOB_STATUSES.New, result);
        break;
      case "esriJobWaiting":
        this.emitter.emit(JOB_STATUSES.Waiting, result);
        break;
      case "esriJobExecuting":
        this.emitter.emit(JOB_STATUSES.Executing, result);
        break;
      case "esriJobSubmitted":
        this.emitter.emit(JOB_STATUSES.Submitted, result);
        break;
      case "esriJobTimedOut":
        this.emitter.emit(JOB_STATUSES.TimedOut, result);
        break;
      case "esriJobFailed":
        this.emitter.emit(JOB_STATUSES.Failed, result);
        break;
      case "expectedFailure":
        this.emitter.emit(JOB_STATUSES.Failure, result);
        break;
      case "esriJobSucceeded":
        this.emitter.emit(JOB_STATUSES.Success, result);
        break;
    }
  };


  on(eventName: string, handler: (e: any) => void) {
    this.emitter.on(eventName, handler);
  }

  once(eventName: string, handler: (e: any) => void) {
    const fn = (arg: any) => {
      this.emitter.off(eventName, fn);
      handler(arg);
    };

    this.emitter.on(
      eventName,
      fn
    );

    (handler as any).__arcgis_job_once_original_function__ = fn;
  }

  off(eventName: string, handler: (e: any) => void) {
    if ((handler as any).__arcgis_job_once_original_function__) {
      this.emitter.off(
        eventName,
        (handler as any).__arcgis_job_once_original_function__
      );
      return;
    }
    this.emitter.off(eventName, handler);
  }

  //will only make a request for on paramName as a string
  async getResults(result: string) {
    return this.waitForJobCompletion().then(jobInfo => {
      return request(this.jobUrl + "/" + jobInfo.results[result].paramUrl, {
        authentication: this.authentication
      });
    });
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      startMonitoring: this.isMonitoring,
      pollingRate: this.pollingRate
    }
  }

  serialize() {
    return JSON.stringify(this)
  }

  static deserialize(serializeString: string) {
    return new Job(JSON.parse(serializeString));
  }

  //checks to see if the jobStatus is completed, if not, it will either resolve with the results or reject
  async waitForJobCompletion() {
    const jobInfo = await this.getJobInfo();
    if (jobInfo.jobStatus === "esriJobSucceeded") {
      return Promise.resolve(jobInfo);
    }
    //if jobStatus comes back immediately with one of the statuses
    if (jobInfo.jobStatus === "esriJobTimeOut" || jobInfo.jobStatus === "esriJobCancelled" || jobInfo.jobStatus === "esriJobFailed") {
      this.stopInternalEventMonitoring();
      return Promise.reject(jobInfo);
    }
    //waits to see what the status is if not immediate
    return new Promise((resolve, reject) => {
      this.startInternalEventMonitoring();

      this.once(JOB_STATUSES.Cancelled, (jobInfo) => {
        this.stopInternalEventMonitoring();
        reject(jobInfo);
      });

      this.once(JOB_STATUSES.TimedOut, (jobInfo) => {
        this.stopInternalEventMonitoring();
        reject(jobInfo);
      });

      this.once(JOB_STATUSES.Failed, (jobInfo) => {
        this.stopInternalEventMonitoring();
        reject(jobInfo);
      });

      this.once(JOB_STATUSES.Success, (jobInfo) => {
        this.stopInternalEventMonitoring();
        resolve(jobInfo);
      });
    });
  }

  //gets all the results from the returned results array, will do a promise.all of the requests and then ensure that they are ordered by on the results array index
  async getAllResults() {
    return this.waitForJobCompletion().then(jobInfo => {
      const keys = Object.keys(jobInfo.results);

      const requests = keys.map(key => {
        return request(this.jobUrl + "/" + jobInfo.results[key].paramUrl, {
          authentication: this.authentication
        }).then(results => {
          return results
        });
      });
      return Promise.all(requests).then((resultsArray: any) => {
        return keys.reduce((finalResults: any, key: string, index: number) => {
          finalResults[keys[index]] = resultsArray[index];
          return finalResults;
        }, {})
      });

    });
  };


  //cancels the job, will return an object with message array stating the request was submitted and cancel was complete
  cancelJob() {
    return request(this.jobUrl + "/cancel", {
      authentication: this.authentication,
      params: { id: this.id, returnMessages: false }
    }).then((response: any) => {
      this.emitter.emit("cancelled", response);
      return response;
    });
  }

  //interal monitoring if the user specifies startMonitoring: false, we need to check the status to see when the results are returned
  private startInternalEventMonitoring() {
    if (!this.setIntervalHandler) {
      this.setIntervalHandler = setInterval(this.executePoll, this.pollingRate);
    }
  }

  private stopInternalEventMonitoring() {
    if (this.setIntervalHandler && !this.didUserEnableMonitoring) {
      clearTimeout(this.setIntervalHandler);
    }
  }

  startEventMonitoring() {
    this.didUserEnableMonitoring = true;
    if (!this.setIntervalHandler) {
      this.setIntervalHandler = setInterval(this.executePoll, this.pollingRate);
    }
  }

  stopEventMonitoring() {
    if (this.setIntervalHandler && this.didUserEnableMonitoring) {
      clearTimeout(this.setIntervalHandler);
    }
  }
}
