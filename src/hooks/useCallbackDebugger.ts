import { useCallback } from 'react';
import usePrevious from 'hooks/usePrevious';

export default function useCallbackDebugger(callback: any, dependencies: any[], dependencyNames: any[] = []) {
    const previousDeps = usePrevious(dependencies);

    const changedDeps = dependencies.reduce((accum, dependency, index) => {
        if (dependency !== previousDeps[index]) {
            const keyName = dependencyNames[index] || index;
            return {
                ...accum,
                [keyName]: {
                    before: previousDeps[index],
                    after: dependency,
                },
            };
        }

        return accum;
    }, {});

    if (Object.keys(changedDeps).length) {
        console.log('[use-callback-debugger] ', changedDeps);
    }

    return useCallback(callback, dependencies);
}