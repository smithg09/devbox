import { Button, CopyButton as DefaultCopyButton, MantineSize, Tooltip } from "@mantine/core";
import {} from "@tauri-apps/api";
import * as clipboard from "@tauri-apps/plugin-clipboard-manager";
import { BsCheck2, BsCopy } from "react-icons/bs";

type CopyProps = {
  value: number | string;
  label: string;
  size?: MantineSize;
  fullWidth?: boolean;
  variant?: "filled" | "light" | "subtle";
};

export function CopyButton({
  value,
  label,
  size,
  fullWidth = true,
  variant = "filled",
}: CopyProps) {
  return (
    <DefaultCopyButton value={value.toString()} timeout={2400}>
      {({ copied, copy }) => (
        <Tooltip label={"Copy"}>
          <Button
            leftSection={copied ? <BsCheck2 size={14} /> : <BsCopy size={14} />}
            size={size ?? "xs"}
            fullWidth={fullWidth}
            variant={variant}
            onClick={() => {
              copy();
              clipboard.writeText(value.toString());
            }}
          >
            {copied ? "Copied" : label}
          </Button>
        </Tooltip>
      )}
    </DefaultCopyButton>
  );
}
