export type Company = {
  id: string;
  name: string;
  careersUrl?: string;

  locations: string[];
  employmentType: "Remote" | "Hybrid" | "In-office";

  interviewProcess?: string;
};
