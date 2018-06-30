import { Observable } from '../Observable';
import { ObservableLike, SchedulerLike } from '../types';
export declare function fromObservable<T>(input: ObservableLike<T>, scheduler: SchedulerLike): Observable<T>;
