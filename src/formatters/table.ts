export interface TableColumn {
  key: string;
  header: string;
  minWidth?: number;
}

export function formatTable(
  columns: TableColumn[],
  rows: Array<Record<string, string | null | undefined>>,
): string {
  if (rows.length === 0) {
    return "No instances found.";
  }

  const widths = columns.map((column) => {
    const headerLen = column.header.length;
    const cellLen = Math.max(...rows.map((row) => displayValue(row[column.key]).length), 0);
    return Math.max(headerLen, cellLen, column.minWidth ?? 0);
  });

  const header = columns
    .map((column, index) => pad(column.header.toUpperCase(), widths[index]!))
    .join("  ");

  const body = rows
    .map((row) =>
      columns.map((column, index) => pad(displayValue(row[column.key]), widths[index]!)).join("  "),
    )
    .join("\n");

  return `${header}\n${body}`;
}

function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return value;
}

function pad(value: string, width: number): string {
  if (value.length >= width) {
    return value;
  }
  return value + " ".repeat(width - value.length);
}
