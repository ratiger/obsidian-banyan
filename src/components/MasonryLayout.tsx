import * as React from "react";

interface MasonryLayoutProps {
  children: React.ReactNode[];
  columns: number;
}

export const MasonryLayout = ({ children, columns }: MasonryLayoutProps) => {
  const getColumns = (items: React.ReactNode[], colCount: number) => {
    const cols: React.ReactNode[][] = Array.from({ length: colCount }, () => []);
    items.forEach((item, idx) => {
      cols[idx % colCount].push(item);
    });
    return cols;
  };

  const columnsData = getColumns(children, columns);

  return (
    <>
      {columnsData.map((col, idx) => (
        <div className="main-cards-column" key={idx}>{col}</div>
      ))}
    </>
  );
};
