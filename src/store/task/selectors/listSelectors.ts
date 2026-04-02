import type { TaskStoreState } from '../initialState';
import type { TaskListItem } from '../slices/list/initialState';

const taskList = (s: TaskStoreState): TaskListItem[] => s.tasks;

const taskListTotal = (s: TaskStoreState) => s.tasksTotal;

const isTaskListInit = (s: TaskStoreState) => s.isTaskListInit;

const viewMode = (s: TaskStoreState) => s.viewMode;

const statusDisplayMap: Record<string, string> = {
  backlog: 'Backlog',
  canceled: 'Canceled',
  completed: 'Done',
  failed: 'Needs input',
  paused: 'Needs input',
  running: 'In progress',
};

const getDisplayStatus = (status: string): string => statusDisplayMap[status] ?? status;

// Kanban 4 columns: Backlog → In progress → Needs input → Done
// Individual selectors to avoid creating new objects on every call (shallow equality)
// TODO [LOBE-6589]: 迁移到 group list 后，改为直接读取 state 中的 taskGroups
const backlogTasks = (s: TaskStoreState) => s.tasks.filter((t) => t.status === 'backlog');
const runningTasks = (s: TaskStoreState) => s.tasks.filter((t) => t.status === 'running');
const needsInputTasks = (s: TaskStoreState) =>
  s.tasks.filter((t) => t.status === 'paused' || t.status === 'failed');
const doneTasks = (s: TaskStoreState) => s.tasks.filter((t) => t.status === 'completed');

const isListEmpty = (s: TaskStoreState) => s.isTaskListInit && s.tasks.length === 0;

export const taskListSelectors = {
  backlogTasks,
  doneTasks,
  getDisplayStatus,
  isListEmpty,
  isTaskListInit,
  needsInputTasks,
  runningTasks,
  taskList,
  taskListTotal,
  viewMode,
};
