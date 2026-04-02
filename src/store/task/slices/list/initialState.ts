import type { taskService } from '@/services/task';

// Derive task list item type from TRPC inference via service
export type TaskListItem = Awaited<ReturnType<typeof taskService.list>>['data'][number];

export type TaskViewMode = 'kanban' | 'list';

export interface TaskListSliceState {
  isTaskListInit: boolean;
  listAgentId?: string;
  tasks: TaskListItem[];
  tasksTotal: number;
  viewMode: TaskViewMode;
}

export const initialTaskListSliceState: TaskListSliceState = {
  isTaskListInit: false,
  tasks: [],
  tasksTotal: 0,
  viewMode: 'list',
};
