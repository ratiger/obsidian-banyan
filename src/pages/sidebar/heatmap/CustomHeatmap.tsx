import moment from 'moment';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { SortType } from 'src/models/Enum';
import { FileInfo } from 'src/models/FileInfo';
import { useCombineStore } from 'src/store';
import { i18n } from 'src/utils/i18n';
import { Icon } from 'src/components/Icon';

export type HeatmapData = {
    date: string,
    count: number,
}

export const CustomHeatmap = ({
    onCickDate,
    cellSize = 14,
    gapSize = 6,
    fontSize = 14,
}: {
    onCickDate: (date: string) => void,
    cellSize?: number,
    gapSize?: number,
    fontSize?: number,
}) => {
    const sortType = useCombineStore((state) => state.appData.sortType);
    const allFiles = useCombineStore((state) => state.allFiles);
    const firstUseDateStr = useCombineStore((state) => state.appData.firstUseDate);

    const values = useMemo(() => getHeatmapValues(allFiles, sortType), [allFiles, sortType]);

    const valueMap = useMemo(() => {
        const map = new Map<string, number>();
        values.forEach(v => {
            map.set(v.date, v.count);
        });
        return map;
    }, [values]);

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const earliestDate = useMemo(() => {
        // Default to 1 year ago (52 weeks ago)
        let d = new Date(today);
        d.setFullYear(today.getFullYear() - 1);

        // Find the earliest file date in values
        if (values && values.length > 0) {
            values.forEach(v => {
                const dateVal = new Date(v.date);
                if (!isNaN(dateVal.getTime()) && dateVal < d) {
                    d = dateVal;
                }
            });
        }

        // Check first use date
        if (firstUseDateStr) {
            const fud = new Date(firstUseDateStr);
            if (!isNaN(fud.getTime()) && fud < d) {
                d = fud;
            }
        }
        return d;
    }, [values, firstUseDateStr, today]);

    // Align to Sunday of start week
    const startOfWeek = useMemo(() => {
        const d = new Date(earliestDate);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [earliestDate]);

    // Align to Saturday of end week
    const endOfWeek = useMemo(() => {
        const d = new Date(today);
        const day = d.getDay();
        d.setDate(d.getDate() + (6 - day));
        d.setHours(23, 59, 59, 999);
        return d;
    }, [today]);

    // Generate weeks array
    const weeks = useMemo(() => {
        const result: {
            date: Date;
            dateStr: string;
            count: number;
            level: number;
            isToday: boolean;
            isFuture: boolean;
            tooltipText: string;
        }[][] = [];

        const currentDay = new Date(startOfWeek);
        let currentWeek: typeof result[0] = [];

        const getDayLevel = (count: number) => {
            if (count === 0) return 0;
            const numPerLevel = 4;
            const numOflevels = 3;
            return Math.min(numOflevels, Math.ceil(count / numPerLevel));
        };

        const todayStr = moment(today).format('YYYY-MM-DD');

        while (currentDay <= endOfWeek) {
            const dateStr = moment(currentDay).format('YYYY-MM-DD');
            const count = valueMap.get(dateStr) || 0;
            const level = getDayLevel(count);
            const isToday = dateStr === todayStr;
            const isFuture = currentDay > today;

            const activityText = (sortType === 'created' || sortType === 'earliestCreated')
                ? i18n.t('notes_created_at')
                : i18n.t('notes_modified_at');
            const tooltipText = count > 0
                ? `${count} ${activityText} ${dateStr}`
                : `${i18n.t('empty_note_result')} ${dateStr}`;

            currentWeek.push({
                date: new Date(currentDay),
                dateStr,
                count,
                level: isFuture ? 0 : level,
                isToday,
                isFuture,
                tooltipText,
            });

            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }

            currentDay.setDate(currentDay.getDate() + 1);
        }

        return result;
    }, [startOfWeek, endOfWeek, valueMap, today, sortType]);

    // Precalculate which week columns should render a month label to avoid collisions
    const labelIndices = useMemo(() => {
        const indices = new Set<number>();
        let lastLabelIndex = -10;

        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const prevWeek = weeks[i - 1];
            const isNewMonth = i === 0 || week[0].date.getMonth() !== prevWeek[0].date.getMonth();

            if (isNewMonth) {
                // If it's the very first column, check if the next month is too close (within 3 columns)
                if (i === 0) {
                    let nextMonthIndex = -1;
                    for (let j = 1; j < weeks.length; j++) {
                        if (weeks[j][0].date.getMonth() !== week[0].date.getMonth()) {
                            nextMonthIndex = j;
                            break;
                        }
                    }
                    // Skip the very first month label if it's too short, prioritizing the next month's clean render
                    if (nextMonthIndex !== -1 && nextMonthIndex < 3) {
                        continue;
                    }
                }

                // Spacing check: Only render month label if it's at least 3 columns away from the last rendered label
                if (i - lastLabelIndex >= 3) {
                    indices.add(i);
                    lastLabelIndex = i;
                }
            }
        }
        return indices;
    }, [weeks]);

    // Find the first index that displays a month label
    const firstLabelIndex = useMemo(() => {
        let min = Infinity;
        labelIndices.forEach(idx => {
            if (idx < min) min = idx;
        });
        return min === Infinity ? -1 : min;
    }, [labelIndices]);

    // Format the month label: January displays ONLY the year, first label displays Year + Month
    const getMonthLabelText = (date: Date, isFirst: boolean) => {
        const monthIndex = date.getMonth();
        const monthName = i18n.t(`month${monthIndex + 1}` as any);
        const year = date.getFullYear();
        const isJanuary = monthIndex === 0;

        if (isJanuary) {
            return `${year}`;
        }

        if (isFirst) {
            return `${monthName}`;
        }
        return monthName;
    };

    // Scroll control ref
    const containerRef = useRef<HTMLDivElement>(null);
    const hasScrolledRef = useRef(false);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            setCanScrollLeft(scrollLeft > 1);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', updateScrollButtons);
            updateScrollButtons();
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', updateScrollButtons);
            }
        };
    }, [weeks]);

    // Initial scroll to today (far right)
    useEffect(() => {
        if (containerRef.current && weeks.length > 0) {
            if (!hasScrolledRef.current) {
                containerRef.current.scrollLeft = containerRef.current.scrollWidth;
                hasScrolledRef.current = true;
            }
            updateScrollButtons();
        }
    }, [weeks.length]);

    // Mouse drag-to-scroll panning state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - containerRef.current.offsetLeft);
        setScrollLeftState(containerRef.current.scrollLeft);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        // Sensitivity factor: 1.5
        const walk = (x - startX) * 1.5;
        containerRef.current.scrollLeft = scrollLeftState - walk;
    };

    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };

    const handleScrollLeft = () => {
        if (containerRef.current) {
            const scrollAmount = (cellSize + gapSize) * 12; // approx 3 months
            containerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        if (containerRef.current) {
            const scrollAmount = (cellSize + gapSize) * 12; // approx 3 months
            containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="custom-heatmap-container">

            {/* Scrollable Grid */}
            <div className="custom-heatmap-scroll-wrapper">
                <div
                    className={`custom-heatmap-scroll-container ${isDragging ? 'is-dragging' : ''}`}
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                >
                    <div className="custom-heatmap-content-wrapper">
                        {/* Month Labels Row */}
                        <div className="custom-heatmap-months-row" style={{ gap: `${gapSize}px` }}>
                            {weeks.map((week, index) => {
                                const showLabel = labelIndices.has(index);
                                const isFirst = index === firstLabelIndex;
                                return (
                                    <div key={index} className="custom-heatmap-month-label-col" style={{ width: `${cellSize}px` }}>
                                        {showLabel && (
                                            <span className="custom-heatmap-month-label" style={{ fontSize: `${fontSize}px` }}>
                                                {getMonthLabelText(week[0].date, isFirst)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day Grid Row */}
                        <div className="custom-heatmap-grid-row" style={{ gap: `${gapSize}px` }}>
                            {weeks.map((week, index) => (
                                <div key={index} className="custom-heatmap-week-column" style={{ gap: `${gapSize}px` }}>
                                    {week.map((day) => (
                                        <div
                                            key={day.dateStr}
                                            className={`custom-heatmap-day-cell color-scale-${day.level} ${day.isToday ? 'is-today' : ''} ${day.isFuture ? 'is-future' : ''}`}
                                            style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                                            data-tooltip-id="custom-heatmap-tooltip"
                                            data-tooltip-content={day.tooltipText}
                                            onClick={() => !day.isFuture && onCickDate(day.dateStr)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    className={`custom-heatmap-arrow-btn clickable-icon left ${!canScrollLeft ? 'is-disabled' : ''}`}
                    onClick={handleScrollLeft}
                    disabled={!canScrollLeft}
                >
                    <Icon name="chevron-left" size={10} />
                </button>
                <button
                    className={`custom-heatmap-arrow-btn clickable-icon right ${!canScrollRight ? 'is-disabled' : ''}`}
                    onClick={handleScrollRight}
                    disabled={!canScrollRight}
                >
                    <Icon name="chevron-right" size={10} />
                </button>
            </div>

            <Tooltip id="custom-heatmap-tooltip" className="custom-heatmap-tooltip" />
        </div>
    );
};

export const getHeatmapValues = (fileInfos: FileInfo[], sortType: SortType) => {
    const valueMap = fileInfos
        .map(f => f.file.stat)
        .map(stat => {
            const timestamp = (sortType === 'created' || sortType === 'earliestCreated') ? stat.ctime : stat.mtime;
            return moment(timestamp).format('YYYY-MM-DD');
        })
        .reduce<Map<string, number>>(
            (pre, cur) => pre.set(cur, pre.has(cur) ? pre.get(cur)! + 1 : 1),
            new Map<string, number>());
    return Array
        .from(valueMap.entries())
        .map(([key, value]) => {
            return { date: key, count: value };
        });
};
