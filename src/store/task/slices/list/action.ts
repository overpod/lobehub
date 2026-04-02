import { mutate, useClientDataSWR } from '@/libs/swr';
import { taskService } from '@/services/task';
import type { StoreSetter } from '@/store/types';

import type { TaskStore } from '../../store';
import type { TaskListItem, TaskViewMode } from './initialState';

const FETCH_TASK_LIST_KEY = 'fetchTaskList';

type Setter = StoreSetter<TaskStore>;

export const createTaskListSlice = (set: Setter, get: () => TaskStore, _api?: unknown) =>
  new TaskListSliceActionImpl(set, get, _api);

export class TaskListSliceActionImpl {
  readonly #get: () => TaskStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => TaskStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  refreshTaskList = async (): Promise<void> => {
    const { listAgentId } = this.#get();
    await mutate([FETCH_TASK_LIST_KEY, listAgentId]);
  };

  setListAgentId = (agentId?: string): void => {
    this.#set({ listAgentId: agentId }, false, 'setListAgentId');
  };

  setViewMode = (mode: TaskViewMode): void => {
    this.#set({ viewMode: mode }, false, 'setViewMode');
  };

  useFetchTaskList = (agentId?: string, enabled: boolean = true) => {
    // Sync listAgentId so refreshTaskList() uses the correct SWR key
    if (agentId && this.#get().listAgentId !== agentId) {
      this.#set({ listAgentId: agentId }, false, 'useFetchTaskList/syncAgentId');
    }

    return useClientDataSWR(
      enabled && agentId ? [FETCH_TASK_LIST_KEY, agentId] : null,
      async ([, id]: [string, string]) => {
        return taskService.list({ assigneeAgentId: id });
      },
      {
        fallbackData: { data: [], success: true, total: 0 },
        onSuccess: (data: { data: TaskListItem[]; total: number }) => {
          this.#set(
            {
              isTaskListInit: true,
              tasks: data.data,
              tasksTotal: data.total,
            },
            false,
            'useFetchTaskList/onSuccess',
          );
        },
        revalidateOnFocus: false,
      },
    );
  };
}

export type TaskListSliceAction = Pick<TaskListSliceActionImpl, keyof TaskListSliceActionImpl>;
