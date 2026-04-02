import { describe, expect, it } from 'vitest';

import type { TaskStoreState } from '../initialState';
import { initialState } from '../initialState';
import { taskListSelectors } from './listSelectors';

const createState = (overrides: Partial<TaskStoreState> = {}): TaskStoreState => ({
  ...initialState,
  ...overrides,
});

describe('taskListSelectors', () => {
  describe('getDisplayStatus', () => {
    it('should map backend statuses to UI labels', () => {
      expect(taskListSelectors.getDisplayStatus('backlog')).toBe('Backlog');
      expect(taskListSelectors.getDisplayStatus('running')).toBe('In progress');
      expect(taskListSelectors.getDisplayStatus('paused')).toBe('Needs input');
      expect(taskListSelectors.getDisplayStatus('failed')).toBe('Needs input');
      expect(taskListSelectors.getDisplayStatus('completed')).toBe('Done');
      expect(taskListSelectors.getDisplayStatus('canceled')).toBe('Canceled');
    });

    it('should return raw status for unknown values', () => {
      expect(taskListSelectors.getDisplayStatus('unknown')).toBe('unknown');
    });
  });

  describe('kanban column selectors', () => {
    const tasks = [
      { identifier: 'T-1', status: 'backlog' as const },
      { identifier: 'T-2', status: 'running' as const },
      { identifier: 'T-3', status: 'paused' as const },
      { identifier: 'T-4', status: 'failed' as const },
      { identifier: 'T-5', status: 'completed' as const },
      { identifier: 'T-6', status: 'canceled' as const },
      { identifier: 'T-7', status: 'running' as const },
    ] as any[];

    const state = createState({ tasks });

    it('should filter backlog tasks', () => {
      const result = taskListSelectors.backlogTasks(state);
      expect(result).toHaveLength(1);
      expect(result[0].identifier).toBe('T-1');
    });

    it('should filter running tasks', () => {
      const result = taskListSelectors.runningTasks(state);
      expect(result).toHaveLength(2);
    });

    it('should filter needsInput tasks (paused + failed)', () => {
      const result = taskListSelectors.needsInputTasks(state);
      expect(result).toHaveLength(2);
      expect(result.map((t: any) => t.identifier)).toEqual(['T-3', 'T-4']);
    });

    it('should filter done tasks', () => {
      const result = taskListSelectors.doneTasks(state);
      expect(result).toHaveLength(1);
      expect(result[0].identifier).toBe('T-5');
    });

    it('should not include canceled tasks in any kanban column', () => {
      const backlog = taskListSelectors.backlogTasks(state);
      const running = taskListSelectors.runningTasks(state);
      const needsInput = taskListSelectors.needsInputTasks(state);
      const done = taskListSelectors.doneTasks(state);

      const allKanban = [...backlog, ...running, ...needsInput, ...done];
      expect(allKanban.find((t: any) => t.status === 'canceled')).toBeUndefined();
    });
  });

  describe('isListEmpty', () => {
    it('should return false when not initialized', () => {
      const state = createState({ isTaskListInit: false, tasks: [] });
      expect(taskListSelectors.isListEmpty(state)).toBe(false);
    });

    it('should return true when initialized with empty list', () => {
      const state = createState({ isTaskListInit: true, tasks: [] });
      expect(taskListSelectors.isListEmpty(state)).toBe(true);
    });

    it('should return false when initialized with tasks', () => {
      const state = createState({
        isTaskListInit: true,
        tasks: [{ identifier: 'T-1', status: 'backlog' }] as any[],
      });
      expect(taskListSelectors.isListEmpty(state)).toBe(false);
    });
  });

  describe('basic selectors', () => {
    it('should return viewMode', () => {
      expect(taskListSelectors.viewMode(createState({ viewMode: 'kanban' }))).toBe('kanban');
    });

    it('should return isTaskListInit', () => {
      expect(taskListSelectors.isTaskListInit(createState({ isTaskListInit: true }))).toBe(true);
    });

    it('should return taskListTotal', () => {
      expect(taskListSelectors.taskListTotal(createState({ tasksTotal: 42 }))).toBe(42);
    });
  });
});
