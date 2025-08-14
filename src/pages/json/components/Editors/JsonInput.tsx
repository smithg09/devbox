import { MonacoEditor } from "@/components/Monaco/Editor";
import { Box } from "@mantine/core";
import styles from "../styles.module.css";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function JsonInput({ value, onChange }: Props) {
  return (
    <>
      <Box className={styles.inputBox}>
        <MonacoEditor
          language="json"
          value={value}
          setValue={v => onChange(v ?? "")}
          height="100%"
          onEditorMounted={editor => {
            setTimeout(() => editor.layout(), 0);
          }}
        />
      </Box>
    </>
  );
}
