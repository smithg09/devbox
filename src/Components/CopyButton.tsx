import { Button, CopyButton as DefaultCopyButton, MantineSize, Tooltip } from "@mantine/core";
import {} from "@tauri-apps/api";
import { TbCheck, TbCopy } from "react-icons/tb";
import * as clipboard from "@tauri-apps/plugin-clipboard-manager";

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
            leftSection={copied ? <TbCheck size={16} /> : <TbCopy size={16} />}
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
