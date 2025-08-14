import { Box, Text } from "@mantine/core";
import { JsonEditor, githubDarkTheme } from "json-edit-react";
import { useEffect, useState } from "react";
import styles from "../styles.module.css";

type Props = {
  value: unknown | null;
  collapsedDepth: number | boolean;
  onChange?: (next: unknown) => void;
};

export function JsonTree({ value, collapsedDepth, onChange }: Props) {
  const [localData, setLocalData] = useState<any>(value ?? {});

  useEffect(() => {
    setLocalData(value ?? {});
  }, [value]);

  return (
    <Box className={styles.jsonTree}>
      {value != null ? (
        <JsonEditor
          data={localData as any}
          setData={(next: any) => {
            setLocalData(next);
            onChange?.(next);
          }}
          showCollectionCount
          showIconTooltips
          collapse={collapsedDepth}
          collapseAnimationTime={100}
          rootFontSize={14}
          stringTruncate={30}
          collapseClickZones={["left", "header"]}
          theme={[
            githubDarkTheme,
            {
              container: {
                backgroundColor: "transparent",
              },
              input: {
                color: "white",
              },
              collectionElement: {
                cursor: "pointer",
              },
            },
          ]}
        />
      ) : (
        <Text size="sm" c="dimmed">
          No valid JSON to display
        </Text>
      )}
    </Box>
  );
}
