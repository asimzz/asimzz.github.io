export interface WorkExperience {
  title: string;
  description: string;
  roles: string[];
  startDate: Date;
  endDate: Date;
  jobType: JobType;
  companyName: string;
  companyLink: string;
  companyLocation: string;
}

export enum JobType {
  FullTime = "fullTime",
  PartTime = "partTime",
}
