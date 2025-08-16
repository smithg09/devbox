import { Box, Button, Group, Select, Stack, Switch, Text } from "@mantine/core";
import sqlFormatter from "@sqltools/formatter";
import { useEffect, useState } from "react";

import { CopyButton } from "@/components/CopyButton";
import { MonacoEditor } from "@/components/Monaco/Editor";
import { monacoOnMountHandler } from "@/components/Monaco/utils";
import { useLocalStorage } from "@mantine/hooks";

const DEFAULT_QUERY = `
WITH MonthlySales AS (SELECT DATE_TRUNC('month', order_date) AS sales_month, product_id, SUM(quantity * price) AS total_monthly_sales
FROM orders GROUP BY 1, 2),
RankedProducts AS (
SELECT sales_month, product_id, total_monthly_sales, RANK() OVER (PARTITION BY sales_month ORDER BY total_monthly_sales DESC) AS sales_rank
FROM MonthlySales)
SELECT sales_month, product_id, total_monthly_sales
FROM RankedProducts
WHERE sales_rank <= 3
ORDER BY sales_month, sales_rank;`;

type SQLQuery = {
  rawQuery: string;
  formatted: string;
};

export default function SQLFormatter() {
  const [history, setHistory] = useLocalStorage<SQLQuery[]>({
    key: "sql-query-history",
    defaultValue: [],
  });
  const [rawQuery, setRawQuery] = useState(DEFAULT_QUERY);
  const [formatted, setFormatted] = useState("");
  const [trim, setTrim] = useState(true);

  useEffect(() => {
    setFormatted(
      sqlFormatter.format(DEFAULT_QUERY, {
        language: "sql",
        indent: "\t",
        reservedWordCase: "upper",
      })
    );
  }, []);

  return (
    <Stack h="100%" className="overflow-padding">
      <Group gap="sm" align="center" justify="space-between">
        <Group align="center">
          <Switch
            size="xs"
            label="Trim Input"
            checked={trim}
            onChange={e => {
              setTrim(e.currentTarget.checked);
              setFormatted(f => (e.currentTarget.checked ? f.trim() : f));
            }}
          />
          {history?.length > 0 ? (
            <>
              <Select
                size="xs"
                value={null}
                placeholder="Past queries"
                onChange={e => {
                  const query = history.find(q => q.rawQuery === e);
                  if (query) {
                    setRawQuery(query.rawQuery);
                    setFormatted(query.formatted);
                  }
                }}
                data={history.map(q => ({
                  value: q.rawQuery,
                  label: q.formatted.slice(0, 20),
                }))}
              />
            </>
          ) : (
            <Text size="xs" c="orange">
              When you copy a formatted query, it will be saved here.
            </Text>
          )}
        </Group>
        <Group>
          {history?.length > 0 && (
            <Button size="xs" variant="subtle" onClick={() => setHistory([])}>
              Clear History
            </Button>
          )}
          <CopyButton
            fullWidth={false}
            variant="light"
            size="xs"
            value={formatted}
            onClick={() => {
              setHistory([...history, { rawQuery, formatted }]);
            }}
            label="Copy Formatted"
          />
        </Group>
      </Group>
      <Group dir="column" justify="space-between" h="100%" gap={12}>
        <Box
          w="40%"
          h="100%"
          pos="relative"
          flex={1}
          style={{
            overflow: "hidden",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <MonacoEditor
            language="sql"
            value={rawQuery}
            onEditorMounted={monacoOnMountHandler}
            setValue={e => {
              setRawQuery(e as string);
              const f = sqlFormatter.format(e || "", {
                language: "sql",
                indent: "\t",
                reservedWordCase: "upper",
              });
              setFormatted(trim ? f.trim() : f);
            }}
          />
        </Box>
        <Box
          style={{
            borderRadius: "var(--mantine-radius-md)",
            overflow: "hidden",
          }}
          w="50%"
          h="100%"
          pos="relative"
          flex={1}
        >
          <MonacoEditor
            onEditorMounted={monacoOnMountHandler}
            language="sql"
            value={formatted}
            extraOptions={{ readOnly: true }}
          />
        </Box>
      </Group>
    </Stack>
  );
}
