import moment from "moment";

export interface DateRange {
    from: string;
    to: string;
}

export const withinDateRange = (time: number, dateRange: DateRange) => {
    const fromMoment = dateRange.from.length > 0 ? moment(dateRange.from, 'YYYY-MM-DD') : undefined;
    const toMoment = dateRange.to.length > 0 ? moment(dateRange.to, 'YYYY-MM-DD') : undefined;

    if (fromMoment) fromMoment.startOf('day');
    if (toMoment) toMoment.add(1, 'days').startOf('day');

    const from = fromMoment ? fromMoment.valueOf() : undefined;
    const to = toMoment ? toMoment.valueOf() : undefined;

    if (!from && !to) return true;
    if (from && !to) return time >= from;
    if (!from && to) return time <= to;
    return time >= from! && time <= to!;
}

export const emptyDateRange = () => {
    return {
        from: "",
        to: ""
    }
};

export const isEmptyDateRange = (dateRange: DateRange) => {
    return dateRange.from === "" && dateRange.to === "";
}