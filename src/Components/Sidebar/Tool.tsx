import { Box, Text, useMantineTheme } from "@mantine/core";
import cx from "clsx";

import { SidebarTool } from "./types";

import { cloneElement, ReactElement } from "react";
import { useLocation } from "react-router-dom";
import { SIDEBAR_CONSTANTS } from "./constants";
import classes from "./styles.module.css";

type ToolProps = {
  tool: SidebarTool;
  handleNavigation: (to: string) => void;
  showDescription: boolean;
  isModule?: boolean;
};

const Tool = ({ tool, showDescription, handleNavigation, isModule }: ToolProps) => {
  const location = useLocation();
  const theme = useMantineTheme();

  return (
    <Box
      key={tool.id}
      className={cx(classes.navigationItem, {
        [classes.selectedNavigationItem]: location.pathname === tool.to,
      })}
      mt={SIDEBAR_CONSTANTS.SPACING.ITEM_MARGIN_TOP}
      onClick={() => handleNavigation(tool.to)}
      title={tool.description}
    >
      <Box className={classes.itemContent} w="100%">
        {cloneElement(tool.icon as ReactElement, {
          size: isModule ? SIDEBAR_CONSTANTS.ICON_SIZE.SMALL : SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM,
          background: theme.colors?.blue[5],
          flex: 1,
          style: {
            minWidth: isModule
              ? SIDEBAR_CONSTANTS.ICON_SIZE.SMALL
              : SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM,
          },
        })}
        <Box w="80%">
          <Text size="xs" fw={location.pathname === tool.to ? "600" : "400"}>
            {tool.text}
          </Text>
          {showDescription && tool.description && (
            <Text
              size="11px"
              c="dimmed"
              mt={2}
              w="100%"
              styles={{
                root: {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
            >
              {tool.description}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Tool;
