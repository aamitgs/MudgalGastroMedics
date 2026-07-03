export type HmsBuildStatus = "Live MVP" | "Foundation" | "Planned" | "Production Pending";

export type HmsRecordStatus = "Active" | "Pending" | "Completed" | "On Hold";

export type HmsModule = {
  id: string;
  order: number;
  name: string;
  group: "Core" | "Clinical" | "Operations" | "Finance" | "People" | "Digital" | "Production";
  status: HmsBuildStatus;
  summary: string;
  capabilities: string[];
  nextStep: string;
};

export type HmsModuleRecord = {
  id: string;
  moduleId: string;
  title: string;
  status: HmsRecordStatus;
  owner: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  notes: string;
  createdAt: string;
  updatedAt: string;
};
