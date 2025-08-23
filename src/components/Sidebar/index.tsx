import {
  Accordion,
  Box,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { cloneElement, ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import cx from "clsx";
import { useLocation, useNavigate } from "react-router-dom";
import classes from "./styles.module.css";

import { moduleRegistry } from "@/constants/tools";
import { useSidebarShortcuts } from "@/hooks/useSidebarShortcuts";
import { useSidebarState } from "@/hooks/useSidebarState";
import { isTauri } from "@/utils/isTauri";
import { formatShortcutDisplay } from "@/utils/keyboard";
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import { useLocalStorage } from "@mantine/hooks";
import { BsDownload, BsGear, BsHouse, BsSearch } from "react-icons/bs";
import { SidebarConfig } from "../Settings";
import { SIDEBAR_CONSTANTS } from "./constants";
import Tool from "./Tool";
import { DropDownItem, Props, SidebarTool } from "./types";
import { APP_CONFIG } from "@/constants/app";

export const Sidebar = ({ collapsed, setCollapsed }: Props) => {
  const location = useLocation();
  const theme = useMantineTheme();
  const nav = useNavigate();

  const { sidebarTools, updateSidebarOrder } = useSidebarState();
  const { searchInputRef } = useSidebarShortcuts({ collapsed, setCollapsed });
  const [sidebarConfig] = useLocalStorage<SidebarConfig>({
    key: "sidebarConfig",
    defaultValue: {
      showDescription: true,
      showModules: true,
      hiddenTools: [],
    },
  });

  const { showDescription, hiddenTools, showModules } = sidebarConfig;
  const [openedModule, setOpenedModule] = useState<string | null>(null);

  useEffect(() => {
    const active = document.querySelector(`.${classes.activeItem}`);
    if (active) {
      active.scrollIntoView({
        block: SIDEBAR_CONSTANTS.SCROLL_BEHAVIOR.BLOCK,
        behavior: SIDEBAR_CONSTANTS.SCROLL_BEHAVIOR.BEHAVIOR,
      });
    }
  }, [classes.activeItem, location.pathname, sidebarTools]);

  useEffect(() => {
    const activeTool = sidebarTools.find(tool => tool.to === location.pathname);
    if (activeTool && activeTool.module) {
      setOpenedModule(activeTool.module);
    } else {
      setOpenedModule(null);
    }
  }, [location.pathname, sidebarTools]);

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
      gap={4}
    >
      <Stack
        className={cx(classes.headerSection, {
          [classes.collapsedHeaderSection]: collapsed,
          [classes.tauriHeaderSection]: isTauri(),
        })}
        gap={2}
      >
        <Group wrap="nowrap" align="center" gap={2} ml={-4}>
          <Box style={{ color: "#324298" }} p={8} pb={4} size={32}>
            {isTauri() ? (
              <img src="/logo.png" alt="Devbox" width={32} height={32} />
            ) : (
              <img src="/logo.png" alt="Devbox" width={38} height={38} />
            )}
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
          placeholder={`Search tools... (${formatShortcutDisplay("K")})`}
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

      {/* Dashboard fixed item below search */}
      {!collapsed ? (
        <Stack className={classes.dashboardContainer} gap={4}>
          <Tool
            tool={
              {
                id: "dashboard",
                to: "/dashboard",
                icon: <BsHouse />,
                text: "Dashboard",
                description: "Your daily developer hub",
                module: "utilities",
              } as SidebarTool
            }
            showDescription={showDescription}
            handleNavigation={handleNavigation}
          />
          <Divider w="100%" mx="auto" mt={4} />
        </Stack>
      ) : (
        <>
          <Tooltip label={"Dashboard"} position="left" multiline>
            <Box
              className={cx(classes.collapsedIconItem, {
                [classes.activeItem]: location.pathname === "/dashboard",
              })}
              onClick={() => handleNavigation("/dashboard")}
              mt={8}
              mb={4}
            >
              {cloneElement((<BsHouse />) as ReactElement, {
                size: SIDEBAR_CONSTANTS.ICON_SIZE.LARGE,
              })}
            </Box>
          </Tooltip>
          <Divider w="90%" mx="auto" />
        </>
      )}

      {!collapsed ? (
        <>
          {showModules ? (
            <Stack className={classes.moduleNavigationSection}>
              <Accordion
                variant="filled"
                radius={0}
                mb={10}
                classNames={{
                  item: classes.accordionItem,
                  content: classes.accordionContent,
                }}
                value={openedModule}
                onChange={setOpenedModule}
              >
                {Object.values(moduleRegistry)
                  .filter(module => sidebarTools.find(tool => tool.module === module.id))
                  .map(module => (
                    <Accordion.Item key={module.id} value={module.id}>
                      <Accordion.Control>
                        <Group
                          wrap="nowrap"
                          style={{ whiteSpace: "nowrap" }}
                          gap={8}
                          title={module.description}
                        >
                          {cloneElement(module.icon as ReactElement, {
                            size: SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM,
                            flex: 1,
                            style: {
                              minWidth: SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM,
                              marginRight: 1,
                            },
                          })}
                          <Group gap={8} w="95%">
                            <Text size="12px" fw="500">
                              {module.name}
                            </Text>
                            {showDescription && (
                              <Text
                                size="11px"
                                c="dimmed"
                                w="80%"
                                styles={{
                                  root: {
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  },
                                }}
                              >
                                {module.description}
                              </Text>
                            )}
                          </Group>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Box>
                          {sidebarTools
                            .filter(t => t.module === module.id)
                            .filter(t => !hiddenTools.includes(t.id))
                            .map(tool => (
                              <Tool
                                key={tool.id}
                                tool={tool}
                                showDescription={showDescription}
                                handleNavigation={handleNavigation}
                                isModule
                              />
                            ))}
                        </Box>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
              </Accordion>
            </Stack>
          ) : (
            <Stack className={classes.navigationSection}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppable">
                  {provided => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {sidebarTools
                        .filter(tool => !hiddenTools.includes(tool.id))
                        .map((tool, index) => (
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
                                <Tool
                                  tool={tool}
                                  showDescription={showDescription}
                                  handleNavigation={handleNavigation}
                                />
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
          )}
        </>
      ) : (
        <Stack className={classes.collapsedIconsContainer}>
          {sidebarTools.map(tool => (
            <Tooltip label={tool.text} key={tool.id} position="left" multiline>
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

      <Divider w="90%" mx="auto" mt={0} />
      <Stack className={classes.settingsSection} mt={4}>
        {!isTauri() && (
          <Box
            className={cx(classes.navigationItem)}
            onClick={() => window.open(APP_CONFIG.RELEASES_URL, "_blank")}
          >
            <Box className={classes.itemContent} w="100%">
              {collapsed ? (
                <BsGear size={SIDEBAR_CONSTANTS.ICON_SIZE.LARGE} />
              ) : (
                <>
                  <BsDownload
                    size={SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM}
                    style={{ minWidth: SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM }}
                  />
                  <Box w="80%">
                    <Text size="xs" fw="450">
                      Download App
                      {showDescription && (
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
                          Get the desktop app for the best experience
                        </Text>
                      )}
                    </Text>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}
        <Box
          className={cx(classes.navigationItem, {
            [classes.selectedNavigationItem]: location.pathname === "/settings",
          })}
          onClick={() => handleNavigation("/settings")}
        >
          <Box className={classes.itemContent} w="100%">
            {collapsed ? (
              <BsGear size={SIDEBAR_CONSTANTS.ICON_SIZE.LARGE} />
            ) : (
              <>
                <BsGear
                  size={SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM}
                  style={{ minWidth: SIDEBAR_CONSTANTS.ICON_SIZE.MEDIUM }}
                />
                <Box w="80%">
                  <Text size="xs" fw={location.pathname === "/settings" ? "600" : "450"}>
                    Settings
                    {showDescription && (
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
                        Customize your experience
                      </Text>
                    )}
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
};
