import React, { useState, useCallback } from "react";
import { Stack, Group, Button, Text, Alert, Box, Modal, Divider, Tabs } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { BsUpload, BsX, BsFileEarmark } from "react-icons/bs";
import { useDisclosure } from "@mantine/hooks";

import { HarFile, NetworkEntry } from "./types";
import { parseHarFile, filterEntries, sortEntries } from "./utils";
import { NetworkFilters } from "./NetworkFilters";
import { NetworkTable } from "./NetworkTable";
import { RequestDetails } from "./RequestDetails";
import { WaterfallView } from "./WaterfallView";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { PerformanceTimeline } from "./PerformanceTimeline";

const HarViewer: React.FC = () => {
  const [harFile, setHarFile] = useState<HarFile | null>(null);
  const [entries, setEntries] = useState<NetworkEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<NetworkEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<NetworkEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState({
    search: "",
    domain: "all",
    method: "all",
    status: "all",
    resourceType: "all",
  });

  const [sortField, setSortField] = useState("startedDateTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<string | null>("table");

  // Modal state for request details
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith(".har")) {
      setError("Please upload a valid HAR file (.har extension)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // const text = await file.text();
      const text = await file.text();
      const harData: HarFile = JSON.parse(text);

      // Validate HAR structure
      if (!harData.log || !harData.log.entries) {
        throw new Error("Invalid HAR file structure");
      }

      setHarFile(harData);
      const parsedEntries = parseHarFile(harData);
      setEntries(parsedEntries);
      setFilteredEntries(parsedEntries);
      setSelectedEntry(null);

      // Reset filters
      setFilters({
        search: "",
        domain: "all",
        method: "all",
        status: "all",
        resourceType: "all",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse HAR file");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filtered entries when filters or sort changes
  React.useEffect(() => {
    let filtered = filterEntries(entries, filters);
    filtered = sortEntries(filtered, sortField, sortDirection);
    setFilteredEntries(filtered);
  }, [entries, filters, sortField, sortDirection]);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      domain: "all",
      method: "all",
      status: "all",
      resourceType: "all",
    });
  }, []);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const handleEntrySelect = useCallback(
    (entry: NetworkEntry) => {
      setSelectedEntry(entry);
      openDetails();
    },
    [openDetails]
  );

  const handleClearData = useCallback(() => {
    setHarFile(null);
    setEntries([]);
    setFilteredEntries([]);
    setSelectedEntry(null);
    setError(null);
    closeDetails();
  }, [closeDetails]);

  if (!harFile) {
    return (
      <Stack
        className="overflow-padding"
        gap="xl"
        style={{ height: "100%", justifyContent: "center", overflow: "scroll" }}
      >
        <Box ta="center">
          <Text size="xl" fw={600} mb="md">
            HAR File Viewer
          </Text>
          <Text c="dimmed" mb="xl">
            Analyze network requests from HAR files
          </Text>
        </Box>

        <Dropzone
          onDrop={handleFileUpload}
          accept={{ "application/json": [".har"] }}
          loading={loading}
          style={{
            minHeight: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Group justify="center" gap="xl" style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <BsUpload size={50} color="var(--mantine-color-blue-6)" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <BsX size={50} color="var(--mantine-color-red-6)" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <BsFileEarmark size={50} color="var(--mantine-color-dimmed)" />
            </Dropzone.Idle>

            <Box>
              <Text size="xl" inline>
                Click to select HAR file here
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Upload a .har file exported from browser DevTools
              </Text>
            </Box>
          </Group>
        </Dropzone>

        {error && (
          <Alert color="red" mt="md">
            {error}
          </Alert>
        )}

        <Box ta="center">
          <Text size="sm" c="dimmed">
            💡 <strong>How to get a HAR file:</strong>
          </Text>
          <Text size="sm" c="dimmed" mt="xs">
            1. Open DevTools (F12) → Network tab
          </Text>
          <Text size="sm" c="dimmed">
            2. Perform the network requests you want to analyze
          </Text>
          <Text size="sm" c="dimmed">
            3. Right-click in the Network tab → "Save all as HAR with content"
          </Text>
        </Box>
      </Stack>
    );
  }

  return (
    <Box className="overflow-padding" style={{ height: "100%", overflow: "scroll" }}>
      <Group justify="space-between">
        <Box>
          <Text fw={600} size="md">
            HAR File Analysis
          </Text>
          <Text size="sm" c="dimmed">
            {harFile?.log.creator.name} {harFile?.log.creator.version}
            {harFile?.log.browser &&
              ` • ${harFile.log.browser.name} ${harFile.log.browser.version}`}
          </Text>
        </Box>
        <Button variant="light" size="sm" onClick={handleClearData}>
          Load New File
        </Button>
      </Group>
      <Divider my="md" />

      <NetworkFilters
        entries={entries}
        filteredEntries={filteredEntries}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="table">Table View</Tabs.Tab>
          <Tabs.Tab value="waterfall">Waterfall View</Tabs.Tab>
          <Tabs.Tab value="metrics">Performance Metrics</Tabs.Tab>
          <Tabs.Tab value="timeline">Performance Timeline</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="table" pt="md">
          <NetworkTable
            entries={filteredEntries}
            selectedEntry={selectedEntry}
            onEntrySelect={handleEntrySelect}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </Tabs.Panel>

        <Tabs.Panel value="waterfall" pt="md">
          <WaterfallView
            entries={filteredEntries}
            selectedEntry={selectedEntry}
            onEntrySelect={handleEntrySelect}
          />
        </Tabs.Panel>

        <Tabs.Panel value="metrics" pt="md">
          <PerformanceMetrics entries={filteredEntries} />
        </Tabs.Panel>

        <Tabs.Panel value="timeline" pt="md">
          <PerformanceTimeline
            entries={filteredEntries}
            selectedEntry={selectedEntry}
            onEntrySelect={handleEntrySelect}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Request Details Modal */}
      <Modal
        opened={detailsOpened}
        onClose={closeDetails}
        title="Request Details"
        size="xl"
        styles={{
          content: { height: "90vh" },
          body: { height: "calc(90vh - 80px)", overflowY: "scroll" },
        }}
      >
        {selectedEntry && <RequestDetails entry={selectedEntry} />}
      </Modal>
    </Box>
  );
};

export default HarViewer;
