import type { AutomationTask, AutomationTaskPriority, AutomationTaskStatus } from "@/lib/automation-types";

export type AutomationTaskSortField = "title" | "type" | "priority" | "status" | "dueAt" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AutomationTaskQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AutomationTaskSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: AutomationTaskStatus;
};

export type AutomationTaskQueryResult = {
  tasks: AutomationTask[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(task: AutomationTask, query: string) {
  const haystack = [task.title, task.description, task.patientName, task.phone, task.uhid, task.owner].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

const priorityRank: Record<AutomationTaskPriority, number> = { Urgent: 3, High: 2, Normal: 1, Low: 0 };

function compareBy(field: AutomationTaskSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: AutomationTask, right: AutomationTask) => {
    if (field === "priority") return (priorityRank[left.priority] - priorityRank[right.priority]) * sign;
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the Automation task queue
 * (Track 3.1 rollout). The original UI rendered every task with no cap and
 * no pagination — tasks accumulate from "Generate Tasks" over time, so this
 * replaces unbounded rendering with real pagination. Defaults to soonest-due
 * first (dueAt ascending), matching the original card list's default order.
 */
export function queryAutomationTasks(allTasks: AutomationTask[], params: AutomationTaskQueryParams): AutomationTaskQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allTasks;
  if (params.status) filtered = filtered.filter((task) => task.status === params.status);
  if (query) filtered = filtered.filter((task) => matchesQuery(task, query));

  const sortBy = params.sortBy ?? "dueAt";
  const sortDir = params.sortDir ?? "asc";
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    tasks: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
