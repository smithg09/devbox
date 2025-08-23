import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Text,
  Title,
  Group,
  Checkbox,
  Stack,
  Anchor,
  List,
  ThemeIcon,
  Divider,
  Badge,
} from "@mantine/core";
import { BsDownload, BsCheckCircle, BsStarFill } from "react-icons/bs";
import { isTauri } from "@/utils/isTauri";
import { APP_CONFIG } from "@/constants/app";

const STORAGE_KEY = "devbox_web_warning_dismissed";
const STORAGE_KEY_DONT_SHOW = STORAGE_KEY + "_dont_show";

export const WebInterstitial: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const smallScreen = typeof window !== "undefined" && window.innerWidth <= 720;

  useEffect(() => {
    try {
      if (isTauri()) return; // don't show inside Tauri
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const dontShow = localStorage.getItem(STORAGE_KEY_DONT_SHOW);

      const isMoreThan15Days = dismissed
        ? new Date(dismissed).getTime() - new Date().getTime() > 15 * 24 * 60 * 60 * 1000
        : true;

      if (isMoreThan15Days || (smallScreen && !dontShow)) {
        const t = setTimeout(() => setOpened(true), 300);
        return () => clearTimeout(t);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const persistAndClose = (persist = false) => {
    try {
      if (persist) {
        const date = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, date);
      }
      if (dontShowAgain) {
        localStorage.setItem(STORAGE_KEY_DONT_SHOW, "1");
      }
    } catch (err) {
      // ignore
    }
    setOpened(false);
  };

  const openReleases = () => {
    const url = APP_CONFIG.RELEASES_URL + "/latest";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openRepo = () => {
    const url = APP_CONFIG.PROJECT_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isTauri()) return null;

  return (
    <Modal
      opened={opened}
      onClose={() => persistAndClose(true)}
      title={
        <Title order={4}>
          {smallScreen ? "Not optimzed for smaller screens" : "Thank you for using Devbox"}
        </Title>
      }
      centered
      withCloseButton
      closeOnEscape
      size="lg"
      aria-labelledby="web-warning-title"
    >
      <Stack gap="sm">
        <div style={{ gap: 16 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Text size="sm">
              Thanks for using{" "}
              <Button variant="transparent" h="fit-content" p={0} onClick={openRepo}>
                Devbox
              </Button>{" "}
              — this is best experienced as the desktop app. The desktop version provides a more
              polished editor experience, native integrations, and offline access to your tools.
            </Text>

            <List spacing="xs" size="sm" mt="sm" withPadding>
              <List.Item
                icon={
                  <ThemeIcon size={18} radius="xl" variant="light">
                    <BsCheckCircle />
                  </ThemeIcon>
                }
              >
                Faster editor performance and syntax highlighting
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon size={18} radius="xl" variant="light">
                    <BsCheckCircle />
                  </ThemeIcon>
                }
              >
                Native file system access and drag/drop support
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon size={18} radius="xl" variant="light">
                    <BsCheckCircle />
                  </ThemeIcon>
                }
              >
                Offline usage and automatic updates via the updater
              </List.Item>
            </List>
          </div>
          <Group mt={18} justify="flex-end">
            <Anchor
              size="sm"
              href={APP_CONFIG.RELEASES_URL + "/latest"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Latest desktop release
            </Anchor>
            <Badge variant="filled">Recommended</Badge>
          </Group>
        </div>

        <Divider />

        <Text size="sm">
          If Devbox helped you build something useful, please consider supporting the project by
          starring the repository or opening issues/feedback so we can prioritize improvements.
        </Text>

        <Group justify="space-between" style={{ marginTop: 12, alignItems: "center" }}>
          <Checkbox
            checked={dontShowAgain}
            onChange={e => setDontShowAgain((e.target as HTMLInputElement).checked)}
            label="Don't show this again"
            aria-label="Don't show web warning again"
          />
          <Anchor
            href={APP_CONFIG.RELEASES_URL}
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            View releases
          </Anchor>
        </Group>

        <Group justify="flex-end" gap="sm" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <Button variant="default" onClick={() => persistAndClose(true)} size="xs">
            Continue on web
          </Button>
          <Button
            variant="light"
            onClick={() => {
              openReleases();
              persistAndClose(true);
            }}
            size="xs"
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <BsDownload style={{ marginRight: 8 }} />
              Download
            </span>
          </Button>
          <Button
            color="yellow"
            onClick={() => {
              openRepo();
              persistAndClose(true);
            }}
            size="xs"
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <BsStarFill style={{ marginRight: 8 }} />
              Star
            </span>
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
