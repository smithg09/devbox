import { CopyButton } from "@/Components/CopyButton";
import {
  Button,
  Card,
  Grid,
  Group,
  NativeSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useCallback, useEffect, useState } from "react";
import { BsCalendar, BsClock } from "react-icons/bs";

export default function Epoch() {
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
  const [inputTimestamp, setInputTimestamp] = useState<string>("");
  const [inputDate, setInputDate] = useState<Date | null>(null);
  const [humanInput, setHumanInput] = useState<string>("");
  const [isoInput, setIsoInput] = useState<string>("");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("UTC");
  const [timestampUnit, setTimestampUnit] = useState<string>("milliseconds");

  // Conversion results
  const [timestampResult, setTimestampResult] = useState<{
    unix: number;
    human: string;
    iso: string;
    utc: string;
  } | null>(null);

  const [dateResult, setDateResult] = useState<{
    unix: number;
    human: string;
    iso: string;
    utc: string;
  } | null>(null);

  const [humanResult, setHumanResult] = useState<{
    unix: number;
    human: string;
    iso: string;
    utc: string;
  } | null>(null);

  const [isoResult, setIsoResult] = useState<{
    unix: number;
    human: string;
    iso: string;
    utc: string;
  } | null>(null);

  // Common timezones
  const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time" },
    { value: "America/Chicago", label: "Central Time" },
    { value: "America/Denver", label: "Mountain Time" },
    { value: "America/Los_Angeles", label: "Pacific Time" },
    { value: "Europe/London", label: "London" },
    { value: "Europe/Paris", label: "Paris" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Asia/Shanghai", label: "Shanghai" },
    { value: "Asia/Kolkata", label: "India" },
    { value: "Australia/Sydney", label: "Sydney" },
  ];

  const timestampUnits = [
    { value: "milliseconds", label: "Milliseconds", factor: 1 },
    { value: "seconds", label: "Seconds", factor: 1000 },
    { value: "microseconds", label: "Microseconds", factor: 0.001 },
    { value: "nanoseconds", label: "Nanoseconds", factor: 0.000001 },
  ];

  // Update current timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatInTimezone = useCallback((date: Date, timezone: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }, []);

  const handleTimestampInput = useCallback(() => {
    if (!inputTimestamp) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a timestamp",
        color: "red",
      });
      return;
    }

    const unit = timestampUnits.find(u => u.value === timestampUnit);
    if (!unit) return;

    const numericInput = parseFloat(inputTimestamp);
    if (isNaN(numericInput)) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a valid number",
        color: "red",
      });
      return;
    }

    const timestampMs = numericInput * unit.factor;
    const date = new Date(timestampMs);

    setTimestampResult({
      unix: Math.floor(timestampMs / 1000),
      human: formatInTimezone(date, selectedTimezone),
      iso: date.toISOString(),
      utc: date.toUTCString(),
    });
  }, [inputTimestamp, timestampUnit, selectedTimezone, formatInTimezone]);

  const handleDateInput = useCallback(() => {
    if (!inputDate) {
      notifications.show({
        title: "Invalid Input",
        message: "Please select a date",
        color: "red",
      });
      return;
    }

    const timestamp = inputDate.getTime();
    const date = new Date(timestamp);

    setDateResult({
      unix: Math.floor(timestamp / 1000),
      human: formatInTimezone(date, selectedTimezone),
      iso: date.toISOString(),
      utc: date.toUTCString(),
    });
  }, [inputDate, selectedTimezone, formatInTimezone]);

  const handleHumanInput = useCallback(() => {
    if (!humanInput) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a human readable date",
        color: "red",
      });
      return;
    }

    try {
      const date = new Date(humanInput);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      const timestamp = date.getTime();

      setHumanResult({
        unix: Math.floor(timestamp / 1000),
        human: formatInTimezone(date, selectedTimezone),
        iso: date.toISOString(),
        utc: date.toUTCString(),
      });
    } catch (error) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a valid date format (e.g., '2024-01-15', 'Jan 15, 2024', etc.)",
        color: "red",
      });
    }
  }, [humanInput, selectedTimezone, formatInTimezone]);

  const handleIsoInput = useCallback(() => {
    if (!isoInput) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter an ISO date string",
        color: "red",
      });
      return;
    }

    try {
      const date = new Date(isoInput);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid ISO date");
      }

      const timestamp = date.getTime();

      setIsoResult({
        unix: Math.floor(timestamp / 1000),
        human: formatInTimezone(date, selectedTimezone),
        iso: date.toISOString(),
        utc: date.toUTCString(),
      });
    } catch (error) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a valid ISO date format (e.g., '2024-01-15T10:30:00Z')",
        color: "red",
      });
    }
  }, [isoInput, selectedTimezone, formatInTimezone]);

  const getCurrentTimestampFormatted = useCallback(() => {
    const date = new Date(currentTimestamp);
    return {
      unix: Math.floor(currentTimestamp / 1000),
      human: formatInTimezone(date, selectedTimezone),
      iso: date.toISOString(),
      utc: date.toUTCString(),
    };
  }, [currentTimestamp, selectedTimezone, formatInTimezone]);

  const current = getCurrentTimestampFormatted();

  return (
    <Stack className="overflow-padding" h="100%" gap="md" style={{ overflow: "scroll" }} pt="xl">
      <Grid>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Unix Timestamp (seconds)
            </Text>
            <Group gap="xs">
              <Text ff="monospace" fw={600} size="lg">
                {current.unix}
              </Text>
              <CopyButton
                value={current.unix.toString()}
                variant="subtle"
                size="xs"
                fullWidth={false}
                label="Copy"
              />
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Unix Timestamp (milliseconds)
            </Text>
            <Group gap="xs">
              <Text ff="monospace" fw={600} size="lg">
                {currentTimestamp}
              </Text>
              <CopyButton
                value={currentTimestamp.toString()}
                variant="subtle"
                size="xs"
                fullWidth={false}
                label="Copy"
              />
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={8}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Human Readable ({selectedTimezone})
            </Text>
            <Group gap="xs">
              <Text ff="monospace" fw={600}>
                {current.human}
              </Text>
              <CopyButton
                value={current.human}
                variant="subtle"
                size="xs"
                fullWidth={false}
                label="Copy"
              />
            </Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={4} mt="auto" mb={0}>
          <NativeSelect
            data={timezones}
            value={selectedTimezone}
            onChange={event => setSelectedTimezone(event.currentTarget.value)}
          />
        </Grid.Col>
      </Grid>

      {/* Input Converters */}
      <Grid>
        {/* Unix Timestamp to Human */}
        <Grid.Col span={6}>
          <Card h="100%">
            <Stack gap="md">
              <Group>
                <BsClock size={18} />
                <Text fw={600}>Unix → Human</Text>
              </Group>

              <Stack gap="xs">
                <Group>
                  <NumberInput
                    flex={1}
                    placeholder="Enter timestamp"
                    value={inputTimestamp}
                    onChange={value => setInputTimestamp(value?.toString() || "")}
                    hideControls
                  />
                  <Select
                    data={timestampUnits}
                    value={timestampUnit}
                    onChange={value => setTimestampUnit(value || "milliseconds")}
                    w={130}
                  />
                </Group>
                <Button onClick={handleTimestampInput} variant="light" fullWidth>
                  Convert
                </Button>
              </Stack>

              {timestampResult && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Unix (seconds):
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {timestampResult.unix}
                    </Text>
                    <CopyButton
                      value={timestampResult.unix.toString()}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Human:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {timestampResult.human}
                    </Text>
                    <CopyButton
                      value={timestampResult.human}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      ISO:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {timestampResult.iso}
                    </Text>
                    <CopyButton
                      value={timestampResult.iso}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Human Readable to Unix */}
        <Grid.Col span={6}>
          <Card h="100%">
            <Stack gap="md">
              <Group>
                <BsClock size={18} />
                <Text fw={600}>Human → Unix</Text>
              </Group>

              <Stack gap="xs">
                <TextInput
                  value={humanInput}
                  onChange={event => setHumanInput(event.currentTarget.value)}
                  placeholder="e.g., 2024-01-15, Jan 15 2024 10:30 AM"
                />
                <Button onClick={handleHumanInput} variant="light" fullWidth>
                  Convert
                </Button>
              </Stack>

              {humanResult && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Unix (seconds):
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {humanResult.unix}
                    </Text>
                    <CopyButton
                      value={humanResult.unix.toString()}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Human:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {humanResult.human}
                    </Text>
                    <CopyButton
                      value={humanResult.human}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      ISO:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {humanResult.iso}
                    </Text>
                    <CopyButton
                      value={humanResult.iso}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Date to Unix */}
        <Grid.Col span={6}>
          <Card h="100%">
            <Stack gap="md">
              <Group>
                <BsCalendar size={18} />
                <Text fw={600}>Date → Unix</Text>
              </Group>

              <Stack gap="xs">
                <DateInput
                  value={inputDate}
                  onChange={setInputDate}
                  placeholder="Select date"
                  clearable
                />
                <Button onClick={handleDateInput} variant="light" fullWidth>
                  Convert
                </Button>
              </Stack>

              {dateResult && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Unix (seconds):
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {dateResult.unix}
                    </Text>
                    <CopyButton
                      value={dateResult.unix.toString()}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Human:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {dateResult.human}
                    </Text>
                    <CopyButton
                      value={dateResult.human}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      ISO:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {dateResult.iso}
                    </Text>
                    <CopyButton
                      value={dateResult.iso}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* ISO to Unix */}
        <Grid.Col span={6}>
          <Card h="100%">
            <Stack gap="md">
              <Group>
                <BsClock size={18} />
                <Text fw={600}>ISO → Unix</Text>
              </Group>

              <Stack gap="xs">
                <TextInput
                  value={isoInput}
                  onChange={event => setIsoInput(event.currentTarget.value)}
                  placeholder="e.g., 2024-01-15T10:30:00Z"
                />
                <Button onClick={handleIsoInput} variant="light" fullWidth>
                  Convert
                </Button>
              </Stack>

              {isoResult && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Unix (seconds):
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {isoResult.unix}
                    </Text>
                    <CopyButton
                      value={isoResult.unix.toString()}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Human:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {isoResult.human}
                    </Text>
                    <CopyButton
                      value={isoResult.human}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      UTC:
                    </Text>
                    <Text ff="monospace" fw={500} size="xs">
                      {isoResult.utc}
                    </Text>
                    <CopyButton
                      value={isoResult.utc}
                      variant="subtle"
                      size="xs"
                      fullWidth={false}
                      label="Copy"
                    />
                  </Group>
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
