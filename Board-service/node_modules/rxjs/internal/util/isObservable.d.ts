import { ObservableLike } from '../types';
/** Identifies an input as being Observable (but not necessary an Rx Observable) */
export declare function isObservable(input: any): input is ObservableLike<any>;
