import moment from 'moment';
import { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip'
import { SortType } from 'src/models/Enum';
import { FileInfo } from 'src/models/FileInfo';
import { useCombineStore } from 'src/store';
import { i18n } from 'src/utils/i18n';

export type HeatmapData = {
    date: string,
    count: number,
}

export const Heatmap = ({ onCickDate }: {
    onCickDate: (date: string) => void
}) => {
    const today = new Date();
    const appData = useCombineStore((state) => state.appData);
    const sortType = appData.sortType;
    const allFiles = useCombineStore((state) => state.allFiles);
    const values = useMemo(() => getHeatmapValues(allFiles, sortType), [allFiles, sortType]);
    return (
        <div>
            <CalendarHeatmap
                startDate={shiftDate(today, -12 * 7)}
                endDate={today}
                onClick={(value) => value && onCickDate(value.date)}
                values={values}
                gutterSize={5}
                classForValue={(value: HeatmapData) => {
                    if (!value || value.count === 0) {
                        return 'color-scale-0';
                    }
                    const numPerLevel = 4, numOflevels = 3;
                    const cnt = Math.min(numOflevels, Math.ceil(value.count / numPerLevel));
                    return `color-scale-${cnt}`;
                }}
                tooltipDataAttrs={(value: HeatmapData): { [key: string]: string } => {
                    return {
                        'data-tooltip-id': 'my-tooltip',
                        'data-tooltip-content': value.count != undefined && value.date != undefined ? `${value.count} ${i18n.t((sortType === 'created' || sortType === 'earliestCreated') ? 'notes_created_at' : 'notes_modified_at')} ${value.date}` : '',
                    };
                }}
                showWeekdayLabels={false}
                monthLabels={[
                    i18n.t('month1'), i18n.t('month2'), i18n.t('month3'),
                    i18n.t('month4'), i18n.t('month5'), i18n.t('month6'),
                    i18n.t('month7'), i18n.t('month8'), i18n.t('month9'),
                    i18n.t('month10'), i18n.t('month11'), i18n.t('month12'),
                ]}
                showOutOfRangeDays={true}
            />
            <Tooltip id="my-tooltip" className="heatmap-tooltip" />
        </div>
    );
}

const shiftDate = (date: Date, numDays: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
}

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
}

// 调试用
// const getRange = (count:number) => {
//     return Array.from({ length: count }, (_, i) => i);
// }

// const getRandomInt = (min: number, max: number) => {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// const randomValues = getRange(200).map(index => {
//     const today = new Date();
//     return {
//         date: shiftDate(today, -index).toISOString().slice(0, 10),
//         count: getRandomInt(1, 30),
//     };
// });