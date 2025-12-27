import type { Company } from "@data/types";

export const companies: Company[] = [
  {
    id: "aalyria",
    name: "Aalyria",
    careersUrl: "https://www.aalyria.com/jobs",
    locations: ["Remote"],
    employmentType: "Remote",
    interviewProcess:
      "Timeboxed design exercise and related coding exercise, followed by a technical and behavioral discussion with the team, and a behavioral interview with leadership.",
  },
  {
    id: "able",
    name: "Able",
    careersUrl: "https://able.co/careers",
    locations: ["Lima, PE", "Hybrid"],
    employmentType: "Hybrid",
    interviewProcess:
      "Coding interview, technical interview (backlog refinement and system design), and a leadership interview focused on behavioral skills.",
  },
  {
    id: "abstract",
    name: "Abstract",
    careersUrl: "https://angel.co/abstract/jobs",
    locations: ["San Francisco, CA", "In-office"],
    employmentType: "In-office",
  },
  {
    id: "accenture",
    name: "Accenture",
    careersUrl: "https://www.accenture.com/us-en/careers",
    locations: [
      "San Francisco, CA",
      "Los Angeles, CA",
      "New York, NY",
      "Kuala Lumpur, Malaysia",
    ],
    employmentType: "In-office",
    interviewProcess:
      "Technical phone discussion with an architecture manager, followed by a behavioral interview focusing on soft skills.",
  },
  {
    id: "accredible",
    name: "Accredible",
    careersUrl: "https://www.accredible.com/careers",
    locations: ["Cambridge, UK", "San Francisco, CA", "Remote"],
    employmentType: "Remote",
    interviewProcess:
      "Take-home project, then a pair-programming session and discussion onsite or over Skype.",
  },
  {
    id: "acko",
    name: "Acko",
    careersUrl: "https://www.acko.com/careers",
    locations: ["Mumbai, India"],
    employmentType: "In-office",
    interviewProcess:
      "Phone interview followed by a small take-home problem, then a face-to-face or Skype pair programming session.",
  },
  {
    id: "acumen",
    name: "Acumen",
    careersUrl: "https://www.acumenci.com/careers/",
    locations: ["London, UK"],
    employmentType: "In-office",
    interviewProcess:
      "Small take-home test and participation in some sprint rituals on-site.",
  },
];
