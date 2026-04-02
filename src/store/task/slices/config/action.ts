import type { CheckpointConfig } from '@lobechat/types';

import { taskService } from '@/services/task';
import type { StoreSetter } from '@/store/types';

import type { TaskStore } from '../../store';

type Setter = StoreSetter<TaskStore>;

export const createTaskConfigSlice = (set: Setter, get: () => TaskStore, _api?: unknown) =>
  new TaskConfigSliceActionImpl(set, get, _api);

export class TaskConfigSliceActionImpl {
  readonly #get: () => TaskStore;

  constructor(set: Setter, get: () => TaskStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  markBriefRead = async (briefId: string): Promise<void> => {
    await taskService.markBriefRead(briefId);
    const { activeTaskId, internal_refreshTaskDetail } = this.#get();
    if (activeTaskId) await internal_refreshTaskDetail(activeTaskId);
  };

  resolveBrief = async (
    briefId: string,
    opts?: { action?: string; comment?: string },
  ): Promise<void> => {
    await taskService.resolveBrief(briefId, opts);
    const { activeTaskId, internal_refreshTaskDetail } = this.#get();
    if (activeTaskId) await internal_refreshTaskDetail(activeTaskId);
  };

  runReview = async (id: string, params?: { content?: string; topicId?: string }) => {
    try {
      const result = await taskService.runReview(id, params);
      await this.#get().internal_refreshTaskDetail(id);
      return result;
    } catch (error) {
      console.error('[TaskStore] Failed to run review:', error);
      throw error;
    }
  };

  updateCheckpoint = async (id: string, checkpoint: CheckpointConfig): Promise<void> => {
    this.#get().internal_dispatchTaskDetail({
      id,
      type: 'updateTaskDetail',
      value: { checkpoint },
    });

    try {
      await taskService.updateCheckpoint(id, checkpoint);
      await this.#get().internal_refreshTaskDetail(id);
    } catch (error) {
      console.error('[TaskStore] Failed to update checkpoint:', error);
      await this.#get().internal_refreshTaskDetail(id);
    }
  };

  updateReview = async (
    id: string,
    review: Parameters<typeof taskService.updateReview>[0]['review'],
  ): Promise<void> => {
    this.#get().internal_dispatchTaskDetail({
      id,
      type: 'updateTaskDetail',
      value: { review },
    });

    try {
      await taskService.updateReview({ id, review });
      await this.#get().internal_refreshTaskDetail(id);
    } catch (error) {
      console.error('[TaskStore] Failed to update review:', error);
      await this.#get().internal_refreshTaskDetail(id);
    }
  };

  // TODO [LOBE-6634]: 等后端新增 task.updateModelConfig procedure 后对接
  // 当前通用 task.update({ config }) 会整列覆盖，导致 checkpoint/review 丢失
  // 后端同时需要在 getTaskDetail 返回 model/provider，前端 selector 才能读到
  updateTaskModelConfig = async (
    _id: string,
    _config: { model?: string; provider?: string },
  ): Promise<void> => {
    console.warn('[TaskStore] updateTaskModelConfig is not yet available — waiting for LOBE-6634');
  };

  // 配置周期执行间隔（heartbeatInterval 字段，单位：秒，null 或 0 禁用）
  // 后端周期执行逻辑待 LOBE-6587 就绪后自动生效，前端可先完成 UI 配置
  updatePeriodicInterval = async (id: string, interval: number | null): Promise<void> => {
    try {
      await taskService.update(id, { heartbeatInterval: interval ?? 0 });
      await this.#get().internal_refreshTaskDetail(id);
    } catch (error) {
      console.error('[TaskStore] Failed to update periodic interval:', error);
    }
  };

  // TODO [LOBE-6587]: 定时任务（cron 模式）
  // updateSchedule(id, { pattern, timezone }) — 后端 task.update schema 尚未暴露 schedulePattern/scheduleTimezone
}

export type TaskConfigSliceAction = Pick<
  TaskConfigSliceActionImpl,
  keyof TaskConfigSliceActionImpl
>;
