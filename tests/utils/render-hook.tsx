import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);

export async function renderHook<T>(useValue: () => T) {
  let value: T;
  let renderer: ReactTestRenderer;
  function Harness() {
    value = useValue();
    return null;
  }
  await act(async () => {
    renderer = create(createElement(Harness));
  });
  return {
    get current() {
      return value!;
    },
    async unmount() {
      await act(async () => {
        renderer!.unmount();
      });
    },
  };
}
