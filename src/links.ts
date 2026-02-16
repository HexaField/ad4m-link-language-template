import type {
  LinkSyncAdapter,
  LanguageContext,
  PerspectiveDiff,
  Perspective,
  PerspectiveDiffObserver,
  SyncStateChangeObserver,
  DID,
} from '@coasys/ad4m';
import type { LinkExpression } from './types';

// TODO: Replace this in-memory store with your actual sync/storage backend
// (e.g., a shared DHT, pubsub network, or database)
const links: LinkExpression[] = [];
let revision = '0';

/**
 * Links Adapter — handles syncing links between agents.
 *
 * Links are the core primitive in AD4M perspectives — they connect
 * expressions via subject/predicate/target triples.
 *
 * LinkSyncAdapter is like a git branch: agents commit diffs, sync pulls
 * remote changes, and render() returns the current state.
 */
export class MyLinksAdapter implements LinkSyncAdapter {
  private callbacks: PerspectiveDiffObserver[] = [];
  private syncStateCallbacks: SyncStateChangeObserver[] = [];

  constructor(private context: LanguageContext) {}

  writable(): boolean {
    return true;
  }

  public(): boolean {
    return true;
  }

  async others(): Promise<DID[]> {
    // TODO: Return list of other agents in this neighbourhood
    return [];
  }

  async currentRevision(): Promise<string> {
    return revision;
  }

  async sync(): Promise<PerspectiveDiff> {
    // TODO: Pull remote changes from your backend, push local changes
    // Return any new changes received from other agents
    return { additions: [], removals: [] };
  }

  async render(): Promise<Perspective> {
    // TODO: Return the full current perspective (all links)
    return { links };
  }

  async commit(diff: PerspectiveDiff): Promise<string> {
    // TODO: Persist and broadcast the diff to other agents
    if (diff.additions) {
      links.push(...diff.additions);
    }
    if (diff.removals) {
      for (const removal of diff.removals) {
        const idx = links.findIndex(
          (l) =>
            l.data.source === removal.data.source &&
            l.data.target === removal.data.target &&
            l.data.predicate === removal.data.predicate
        );
        if (idx !== -1) links.splice(idx, 1);
      }
    }
    revision = String(Number(revision) + 1);
    return revision;
  }

  addCallback(callback: PerspectiveDiffObserver): void {
    this.callbacks.push(callback);
  }

  addSyncStateChangeCallback(callback: SyncStateChangeObserver): void {
    this.syncStateCallbacks.push(callback);
  }
}
