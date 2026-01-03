import { useCallback } from 'react';
import { useScrollRegistry } from './useScrollRegistry';
import { useScrollObserver } from './useScrollObserver';

export function useScroll() {
    const registry = useScrollRegistry();
    const observer = useScrollObserver();

    const registerElementRef = useCallback(
        (id: string) => {
            const reg = registry.registerElementRef(id);
            const obs = observer.registerElementRef(id);
            return (el: HTMLElement | null) => {
                reg(el);
                obs(el);
            };
        },
        [registry, observer]
    );

    return {
        scrollToElement: registry.scrollToElement,
        resetContainer: registry.resetContainer,
        containerRef: registry.containerRef,
        contentRef: registry.contentRef,
        visibleElementIds: observer.visibleElementIds,
        registerElementRef,
    };
}
