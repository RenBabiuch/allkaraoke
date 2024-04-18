import usePrevious from 'hooks/usePrevious';
import { isEqual } from 'lodash-es';
import { useEffect } from 'react';

export default function useEffectDebugger(effectHook: any, dependencies: any[], dependencyNames: any[] = []) {
  const previousDeps = usePrevious(dependencies);

  const changedDeps = dependencies.reduce((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
          deepEqual: isEqual(previousDeps[index], dependency),
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps);
  }

  useEffect(effectHook, dependencies);
}
