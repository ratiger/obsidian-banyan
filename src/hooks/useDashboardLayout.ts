import { useState, useCallback, useEffect, RefObject } from 'react';
import { Platform } from 'obsidian';
import { useCombineStore } from 'src/store';

export const useDashboardLayout = <T extends HTMLElement | null>(containerRef: RefObject<T>) => {
    const cardsColumns = useCombineStore((state) => state.settings.cardsColumns);
    const [showSidebar, setShowSidebar] = useState<'normal' | 'hide' | 'show'>(Platform.isMobile ? 'hide' : 'normal');
    const [colCount, setColCount] = useState<'small' | 'one' | 'two'>('one');

    const updateLayout = useCallback((width?: number) => {
        if (Platform.isMobile) {
            setShowSidebar('hide');
            setColCount('small');
            return;
        }

        let containerWidth = width ?? containerRef.current?.clientWidth ?? 0;
        if (containerWidth === 0) return;
        
        containerWidth -= 16; // both padding 8 
        const siderbar = 296;
        const padding = 6;
        const card = 620;
        const cardGap = 16;

        const _showSidebar = containerWidth >= (siderbar + padding + card) ? 'normal' : 'hide';
        setShowSidebar(_showSidebar);

        if (containerWidth < card) {
            setColCount('small');
            return;
        }
        
        if (cardsColumns == 1) {
            setColCount('one');
            return;
        }        

        const cnt = containerWidth >= (siderbar + padding + card + cardGap + card) ? 'two' : 'one';
        setColCount(cnt);
    }, [cardsColumns, containerRef]);

    useEffect(() => {
        // 初始计算
        requestAnimationFrame(() => updateLayout());

        const resizeObserver = new ResizeObserver((entries) => {
            if (!Array.isArray(entries) || !entries.length) return;
            const entry = entries[0];
            const containerWidth = entry.contentRect.width;

            requestAnimationFrame(() => updateLayout(containerWidth));
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [updateLayout, containerRef]);

    return {
        showSidebar,
        setShowSidebar,
        colCount
    };
};
