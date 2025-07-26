import { Box, Divider, Group, Select, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core";
import React, { cloneElement, ReactElement, useCallback, useEffect, useMemo } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import cx from "clsx";
import classes from "./styles.module.css";

import { BsSearch } from "react-icons/bs";
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import { DropDownItem, Props } from "./types";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useSidebarShortcuts } from "@/hooks/useSidebarShortcuts";
import { SIDEBAR_CONSTANTS } from "./constants";

export const Sidebar = ({ collapsed, setCollapsed }: Props) => {
  const location = useLocation();
  const theme = useMantineTheme();
  const nav = useNavigate();

  const { sidebarTools, updateSidebarOrder } = useSidebarState();
  const { searchInputRef } = useSidebarShortcuts({ collapsed, setCollapsed });

  useEffect(() => {
    const active = document.querySelector(`.${classes.activeItem}`);
    if (active) {
      active.scrollIntoView({
        block: SIDEBAR_CONSTANTS.SCROLL_BEHAVIOR.BLOCK,
        behavior: SIDEBAR_CONSTANTS.SCROLL_BEHAVIOR.BEHAVIOR,
      });
    }
  }, [classes.activeItem, location.pathname, sidebarTools]);

  const dropDownItems: DropDownItem[] = useMemo(() => {
    return sidebarTools.map(tool => ({
      label: tool.text,
      value: tool.to,
      icon: tool.icon,
      id: tool.id,
    }));
  }, [sidebarTools]);

  const onDragEnd: OnDragEndResponder = useCallback(
    result => {
      if (!result.destination || result.destination.index === result.source.index) {
        return;
      }

      const items = [...sidebarTools];
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      updateSidebarOrder(items);
    },
    [sidebarTools, updateSidebarOrder]
  );

  const handleNavigation = useCallback(
    (path: string) => {
      nav(path);
    },
    [nav]
  );

  return (
    <Stack
      className={classes.sidebarContainer}
      id="sidebar"
      w={"auto"}
      px="sm"
      align={collapsed ? "center" : undefined}
    >
      <Stack className={collapsed ? classes.collapsedHeaderSection : classes.headerSection} gap={2}>
        <Group wrap="nowrap" align="center" gap={2} ml={-4}>
          <Box style={{ color: "#324298" }} p={8} pb={4} size={32}>
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 24 24"
              height={32}
              width={32}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM4.5 7.65788V16.3469L12 20.689V12L4.5 7.65788Z"></path>
            </svg>
          </Box>
          <Text size={theme?.fontSizes?.xl} fw={700} display={collapsed ? "none" : "block"}>
            DevBox
            <Text hidden size="10px" pt={2} c="dimmed">
              Your central hub for dev tools
            </Text>
          </Text>
        </Group>
        <Select
          ref={searchInputRef}
          data={dropDownItems}
          leftSectionPointerEvents="none"
          leftSection={<BsSearch size={SIDEBAR_CONSTANTS.ICON_SIZE.SMALL} />}
          onChange={value => {
            if (value) {
              handleNavigation(value);
            }
          }}
          size="xs"
          placeholder="Search tools... (⌘K)"
          display={collapsed ? "none" : "block"}
          styles={{
            input: {
              backgroundColor: "transparent",
            },
            dropdown: {
              backgroundColor:
                "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))",
            },
          }}
          allowDeselect={false}
          searchable
          clearable
        />
      </Stack>

      {collapsed && <Divider w="100%" />}

      {!collapsed ? (
        <Stack className={classes.navigationSection}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
              {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sidebarTools.map((tool, index) => (
                    <Draggable key={tool.id} draggableId={tool.id.toString()} index={index}>
                      {provided => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            userSelect: "none",
                          }}
                        >
                          <Box
                            key={tool.id}
                            className={cx(classes.navigationItem, {
                              [classes.selectedNavigationItem]: location.pathname === tool.to,
                            })}
                            mt={SIDEBAR_CONSTANTS.SPACING.ITEM_MARGIN_TOP}
                            onClick={() => handleNavigation(tool.to)}
                          >
                            <Box className={classes.itemContent}>
                              {cloneElement(tool.icon as ReactElement, {
                                size: SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM,
                                background: theme.colors?.blue[5],
                              })}
                              {tool.extra ? (
                                <Tooltip label={tool.extra}>
                                  <Text
                                    size="xs"
                                    fw={location.pathname === tool.to ? "500" : "400"}
                                    c="red"
                                    component={Link}
                                    to={tool.to}
                                  >
                                    {tool.text}
                                  </Text>
                                </Tooltip>
                              ) : (
                                <Text size="xs" fw={location.pathname === tool.to ? "600" : "450"}>
                                  {tool.text}
                                </Text>
                              )}
                            </Box>
                          </Box>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Stack>
      ) : (
        <Stack className={classes.collapsedIconsContainer}>
          {sidebarTools.map(tool => (
            <Tooltip label={tool.text} key={tool.id} position="left">
              <Box
                className={cx(classes.collapsedIconItem, {
                  [classes.activeItem]: location.pathname === tool.to,
                })}
                onClick={() => handleNavigation(tool.to)}
                color={theme.colors?.[tool?.iconColor || "primary"]?.[6]}
              >
                {cloneElement(tool.icon as ReactElement, {
                  size: SIDEBAR_CONSTANTS.ICON_SIZE.LARGE,
                })}
              </Box>
            </Tooltip>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
