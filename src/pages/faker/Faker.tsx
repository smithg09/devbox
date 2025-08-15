import { MonacoEditor } from "@/components/Monaco/Editor";
import { settingsStore } from "@/utils/store";
import { faker } from "@faker-js/faker";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BsArrowsMove,
  BsBraces,
  BsChevronDown,
  BsChevronRight,
  BsDownload,
  BsEye,
  BsEyeSlash,
  BsFiles,
  BsPlayFill,
  BsTrash,
  BsWrench,
} from "react-icons/bs";

import { buildObject, FieldConfig, generateFromSchema, JsonSchema, primitiveTypes } from "./utils";

export default function FakerTool() {
  const [activeTab, setActiveTab] = useState<string | null>("builder");
  const [count, setCount] = useInputState<number>(5);
  const [jsonSchema, setJsonSchema] = useState<string>(`{
  "type": "object",
  "properties": {
    "id": { "type": "string", "faker": "string.uuid" },
    "email": { "type": "string", "faker": "internet.email" },
    "createdAt": { "type": "string", "format": "date-time" },
    "profile": {
      "type": "object",
      "properties": {
        "firstName": { "type": "string", "faker": "person.firstName" },
        "lastName": { "type": "string", "faker": "person.lastName" }
      }
    }
  }
}`);

  const [fields, setFields] = useState<FieldConfig[]>([
    { id: faker.string.uuid(), name: "id", type: "uuid" },
    {
      id: faker.string.uuid(),
      name: "profile",
      type: "object",
      children: [
        { id: faker.string.uuid(), name: "firstName", type: "firstName" },
        { id: faker.string.uuid(), name: "lastName", type: "lastName" },
      ],
    },
    { id: faker.string.uuid(), name: "email", type: "email" },
  ]);

  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("pretty");

  // Sync + persistence refs
  const updatingFromBuilder = useRef(false);
  const updatingFromSchema = useRef(false);
  const schemaLoaded = useRef(false); // ensure we don't overwrite saved value before load

  // Convert builder fields to JSON schema (subset)
  const typeToFaker: Record<string, string> = {
    uuid: "string.uuid",
    email: "internet.email",
    firstName: "person.firstName",
    lastName: "person.lastName",
    fullName: "person.fullName",
    jobTitle: "person.jobTitle",
    phone: "phone.number",
    streetAddress: "location.streetAddress",
    city: "location.city",
    country: "location.country",
    countryCode: "location.countryCode",
    latitude: "location.latitude",
    longitude: "location.longitude",
    ip: "internet.ip",
    url: "internet.url",
    domain: "internet.domainName",
    username: "internet.userName",
    password: "internet.password",
    company: "company.name",
    avatar: "image.avatar",
    color: "color.human",
    currencyCode: "finance.currencyCode",
    iban: "finance.iban",
    bitcoinAddress: "finance.bitcoinAddress",
    sentence: "lorem.sentence",
    paragraph: "lorem.paragraph",
    imageUrl: "image.url",
    date: "date.recent",
  };
  const fakerToType: Record<string, string> = Object.fromEntries(
    Object.entries(typeToFaker).map(([k, v]) => [v, k])
  );

  function fieldToSchema(f: FieldConfig): any {
    if (f.type === "object") {
      return {
        type: "object",
        properties: (f.children || []).reduce<Record<string, any>>((acc, c) => {
          acc[c.name] = fieldToSchema(c);
          return acc;
        }, {}),
      };
    }
    const map: Record<string, any> = {
      string: { type: "string" },
      number: { type: "number" },
      boolean: { type: "boolean" },
      uuid: { type: "string" },
      date: { type: "string", format: "date-time" },
      email: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      fullName: { type: "string" },
      jobTitle: { type: "string" },
      phone: { type: "string" },
      streetAddress: { type: "string" },
      city: { type: "string" },
      country: { type: "string" },
      countryCode: { type: "string" },
      latitude: { type: "number" },
      longitude: { type: "number" },
      ip: { type: "string" },
      url: { type: "string" },
      domain: { type: "string" },
      username: { type: "string" },
      password: { type: "string" },
      company: { type: "string" },
      avatar: { type: "string" },
      color: { type: "string" },
      currencyCode: { type: "string" },
      iban: { type: "string" },
      bitcoinAddress: { type: "string" },
      sentence: { type: "string" },
      paragraph: { type: "string" },
      imageUrl: { type: "string" },
    };
    const base = map[f.type] || { type: "string" };
    const fakerPath = typeToFaker[f.type];
    if (fakerPath) (base as any).faker = fakerPath;
    if (f.array) return { type: "array", items: base };
    return base;
  }
  function fieldsToSchema(list: FieldConfig[]) {
    return {
      type: "object",
      properties: list.reduce<Record<string, any>>((acc, f) => {
        acc[f.name] = fieldToSchema(f);
        return acc;
      }, {}),
    };
  }

  // Schema -> fields
  function schemaNodeToField(name: string, node: any): FieldConfig {
    if (node.type === "object") {
      return {
        id: faker.string.uuid(),
        name,
        type: "object",
        children: schemaToFields(node),
      };
    }
    if (node.type === "array") {
      const inner = schemaNodeToField(name, node.items || { type: "string" });
      return { ...inner, array: true, arrayLength: 3 };
    }
    return { id: faker.string.uuid(), name, type: guessFieldType(node) };
  }
  function schemaToFields(schema: any): FieldConfig[] {
    if (!schema || schema.type !== "object" || !schema.properties) return [];
    return Object.entries(schema.properties).map(([n, sub]: any) => schemaNodeToField(n, sub));
  }
  function guessFieldType(node: any): string {
    if (node && typeof node.faker === "string" && fakerToType[node.faker]) {
      return fakerToType[node.faker];
    }
    if (node.format === "date-time") return "date";
    // Keep only supported primitive types
    const supported = new Set(primitiveTypes.map(p => p.value));
    if (supported.has(node.type)) return node.type;
    return "string";
  }

  // Load persisted schema (localStorage first for reliability, then settings store)
  useEffect(() => {
    (async () => {
      let saved: string | null = null;
      try {
        if (typeof window !== "undefined") {
          saved = window.localStorage.getItem("fakerSchema");
        }
      } catch {
        // ignore localStorage access error
      }
      if (!saved) {
        saved = (await settingsStore.get<string>("fakerSchema")) || null;
      }
      if (saved) {
        try {
          setJsonSchema(saved);
          const parsed = JSON.parse(saved);
          updatingFromSchema.current = true;
          setFields(schemaToFields(parsed));
          updatingFromSchema.current = false;
        } catch {
          // ignore invalid persisted schema
        }
      }
      schemaLoaded.current = true;
    })();
  }, []);

  // Persist schema (debounced)
  useEffect(() => {
    if (!schemaLoaded.current) return; // don't write before initial load finishes
    const id = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("fakerSchema", jsonSchema);
        }
      } catch {
        // ignore localStorage write error
      }
      settingsStore.update("fakerSchema", jsonSchema);
    }, 400);
    return () => clearTimeout(id);
  }, [jsonSchema]);

  // Builder -> schema sync
  useEffect(() => {
    if (updatingFromSchema.current) return;
    const generated = JSON.stringify(fieldsToSchema(fields), null, 2);
    if (jsonSchema !== generated) {
      updatingFromBuilder.current = true;
      setJsonSchema(generated);
    }
  }, [fields]);

  // Schema -> builder sync
  useEffect(() => {
    if (updatingFromBuilder.current) {
      // This change originated from builder; consume the flag and skip processing
      updatingFromBuilder.current = false;
      return;
    }
    try {
      const parsed = JSON.parse(jsonSchema);
      // Build a shape (structure without volatile IDs) to prevent redundant updates
      const newFields = schemaToFields(parsed);
      const shape = (list: FieldConfig[]): any =>
        list.map(f => ({
          name: f.name,
          type: f.type,
          array: !!f.array,
          children: f.children ? shape(f.children) : undefined,
        }));
      const currentShape = JSON.stringify(shape(fields));
      const newShape = JSON.stringify(shape(newFields));
      if (currentShape !== newShape) {
        updatingFromSchema.current = true;
        setFields(prev => {
          // attempt to preserve existing IDs by matching names recursively
          function merge(oldList: FieldConfig[], freshList: FieldConfig[]): FieldConfig[] {
            return freshList.map(f => {
              const existing = oldList.find(o => o.name === f.name && o.type === f.type);
              if (f.type === "object") {
                return {
                  id: existing ? existing.id : f.id,
                  name: f.name,
                  type: "object",
                  array: f.array,
                  arrayLength: f.arrayLength,
                  children: merge(existing?.children || [], f.children || []),
                } as FieldConfig;
              }
              return {
                id: existing ? existing.id : f.id,
                name: f.name,
                type: f.type,
                array: f.array,
                arrayLength: f.arrayLength,
              } as FieldConfig;
            });
          }
          return merge(prev, newFields);
        });
        updatingFromSchema.current = false;
      }
    } catch {
      // ignore while editing invalid JSON
    }
  }, [jsonSchema]);

  function runGeneration() {
    let data: any[] = [];
    try {
      if (activeTab === "schema") {
        const parsed: JsonSchema = JSON.parse(jsonSchema);
        data = Array.from({ length: count }, () => generateFromSchema(parsed));
      } else {
        data = Array.from({ length: count }, () => buildObject(fields));
      }
      setOutput(mode === "pretty" ? JSON.stringify(data, null, 2) : JSON.stringify(data));
      setActiveTab("output");
    } catch (e: any) {
      setOutput(`/* Error: ${e.message} */`);
    }
  }

  function addField() {
    setFields(f => [
      ...f,
      { id: faker.string.uuid(), name: `field${f.length + 1}`, type: "string" },
    ]);
  }

  function updateField(id: string, patch: Partial<FieldConfig>) {
    function walk(list: FieldConfig[]): FieldConfig[] {
      return list.map(item => {
        if (item.id === id) {
          let changed = false;
          for (const [k, v] of Object.entries(patch)) {
            if ((item as any)[k] !== v) {
              changed = true;
              break;
            }
          }
          if (!changed) return item;
          return { ...item, ...patch };
        }
        if (item.children) return { ...item, children: walk(item.children) };
        return item;
      });
    }
    setFields(f => walk(f));
  }

  function removeField(id: string) {
    function walk(list: FieldConfig[]): FieldConfig[] {
      return list
        .filter(item => item.id !== id)
        .map(item => (item.children ? { ...item, children: walk(item.children) } : item));
    }
    setFields(f => walk(f));
  }

  function addChild(parentId: string) {
    const child: FieldConfig = { id: faker.string.uuid(), name: "child", type: "string" };
    function walk(list: FieldConfig[]): FieldConfig[] {
      return list.map(item => {
        if (item.id === parentId) {
          const children = item.children ? [...item.children, child] : [child];
          return { ...item, type: "object", children };
        }
        if (item.children) return { ...item, children: walk(item.children) };
        return item;
      });
    }
    setFields(f => walk(f));
  }

  const schemaValid = useMemo(() => {
    try {
      JSON.parse(jsonSchema);
      return true;
    } catch {
      return false;
    }
  }, [jsonSchema]);

  // Style helpers
  const typeColors: Record<string, string> = {
    string: "blue",
    number: "orange",
    boolean: "grape",
    uuid: "teal",
    date: "cyan",
    email: "pink",
    firstName: "green",
    lastName: "green",
    fullName: "green",
    jobTitle: "violet",
    phone: "lime",
    streetAddress: "indigo",
    city: "indigo",
    country: "indigo",
    ip: "yellow",
    url: "yellow",
    object: "violet",
  };

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});

  // Recursive field editor component
  interface FieldEditorProps {
    field: FieldConfig;
    depth?: number;
    dragHandleProps?: any;
  }

  const FieldEditor = ({ field, depth = 0, dragHandleProps }: FieldEditorProps) => {
    const isObject = field.type === "object";
    const hasChildren = !!field.children?.length;
    const isCollapsed = collapsed[field.id];
    const isPreviewing = previewOpen[field.id];
    const [localName, setLocalName] = useState(field.name);
    useEffect(() => {
      setLocalName(field.name);
    }, [field.name]);
    const previewData = useMemo(
      () => (isObject && isPreviewing ? buildObject(field.children || []) : undefined),
      [isObject, isPreviewing, field.children]
    );

    return (
      <Paper
        withBorder
        shadow={depth === 0 ? "xs" : "0"}
        p={depth === 0 ? "sm" : "xs"}
        radius="md"
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderLeft: depth ? "2px solid var(--mantine-color-dark-4)" : undefined,
        }}
      >
        <Stack gap={6}>
          <Group wrap="nowrap" align="flex-end" gap="xs" justify="space-between">
            <Group gap={4} wrap="nowrap" style={{ flex: 1 }} align="flex-end">
              {isObject && (
                <ActionIcon
                  size="md"
                  variant="subtle"
                  style={{ alignSelf: "center" }}
                  onClick={() => setCollapsed(c => ({ ...c, [field.id]: !c[field.id] }))}
                >
                  {isCollapsed ? <BsChevronRight size={14} /> : <BsChevronDown size={14} />}
                </ActionIcon>
              )}
              <ActionIcon
                size="md"
                variant="subtle"
                aria-label="drag-handle"
                style={{ cursor: "grab", alignSelf: "center" }}
                {...dragHandleProps}
              >
                <BsArrowsMove size={14} />
              </ActionIcon>
              <TextInput
                style={{ flex: 1 }}
                label={depth === 0 ? "Name" : undefined}
                value={localName}
                size="xs"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalName(e.target.value)}
                onBlur={() => {
                  if (localName !== field.name) updateField(field.id, { name: localName });
                }}
              />
              <Select
                style={{ width: 140 }}
                label={depth === 0 ? "Type" : undefined}
                value={field.type}
                data={primitiveTypes}
                size="xs"
                onChange={v => updateField(field.id, { type: v || "string" })}
              />
              <Badge variant="light" color={typeColors[field.type] || "gray"} tt="none" mb={6}>
                {field.type}
              </Badge>
            </Group>
            <Group gap={6} wrap="nowrap" align="flex-end">
              <Tooltip label="Array?">
                <SegmentedControl
                  size="xs"
                  value={field.array ? "yes" : "no"}
                  onChange={v =>
                    updateField(field.id, {
                      array: v === "yes",
                      arrayLength: field.arrayLength || 3,
                    })
                  }
                  data={[
                    { label: "Single", value: "no" },
                    { label: "Array", value: "yes" },
                  ]}
                />
              </Tooltip>
              {field.array && (
                <NumberInput
                  w={80}
                  label="Len"
                  min={1}
                  max={50}
                  value={field.arrayLength}
                  size="xs"
                  onChange={v => updateField(field.id, { arrayLength: Number(v) })}
                  onClick={e => e.stopPropagation()}
                />
              )}
              {isObject && (
                <Button size="xs" variant="subtle" onClick={() => addChild(field.id)}>
                  + Child
                </Button>
              )}
              {isObject && (
                <ActionIcon
                  size="md"
                  variant={isPreviewing ? "filled" : "subtle"}
                  color={isPreviewing ? "blue" : undefined}
                  onClick={() => setPreviewOpen(p => ({ ...p, [field.id]: !p[field.id] }))}
                  title={isPreviewing ? "Hide preview" : "Show preview"}
                >
                  {isPreviewing ? <BsEyeSlash size={14} /> : <BsEye size={14} />}
                </ActionIcon>
              )}
              <Tooltip label="Duplicate">
                <ActionIcon size="md" variant="subtle" onClick={() => duplicateField(field.id)}>
                  <BsFiles size={14} />
                </ActionIcon>
              </Tooltip>
              <ActionIcon color="red" variant="subtle" onClick={() => removeField(field.id)}>
                <BsTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
          {isObject && isPreviewing && previewData && (
            <div
              style={{
                border: "1px solid var(--mantine-color-dark-4)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <MonacoEditor
                language="json"
                value={JSON.stringify(previewData, null, 2)}
                height="140px"
                extraOptions={{ readOnly: true, wordWrap: "on", lineNumbers: "off" }}
              />
            </div>
          )}
          {hasChildren && !isCollapsed && (
            <Droppable droppableId={field.id} type="FIELD">
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    paddingLeft: isObject ? 4 : 0,
                  }}
                >
                  {field.children!.map((c, idx) => (
                    <Draggable draggableId={c.id} index={idx} key={c.id}>
                      {dragProvided => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={{
                            ...(dragProvided.draggableProps.style || {}),
                            marginTop: idx === 0 ? 0 : 6,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <FieldEditor
                            field={c}
                            depth={depth + 1}
                            dragHandleProps={dragProvided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </Stack>
      </Paper>
    );
  };

  // Duplicate field (deep clone with new IDs)
  function duplicateField(id: string) {
    function cloneWithNewIds(f: FieldConfig): FieldConfig {
      return {
        ...f,
        id: faker.string.uuid(),
        children: f.children ? f.children.map(cloneWithNewIds) : undefined,
      };
    }
    function walk(list: FieldConfig[]): FieldConfig[] {
      const out: FieldConfig[] = [];
      for (const f of list) {
        out.push(f);
        if (f.id === id) {
          out.push(cloneWithNewIds(f));
        }
        if (f.children) {
          f.children = walk(f.children); // safe since we replace list later with deep clone pass
        }
      }
      return out;
    }
    setFields(f => cloneFields(walk(cloneFields(f))));
  }

  function cloneFields(list: FieldConfig[]): FieldConfig[] {
    return list.map(f => ({
      ...f,
      children: f.children ? cloneFields(f.children) : undefined,
    }));
  }

  // Drag and drop reorder logic
  function getArrayByDroppableId(list: FieldConfig[], id: string): FieldConfig[] | null {
    if (id === "root") return list;
    const stack: FieldConfig[] = [...list];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.id === id) return cur.children || (cur.children = []);
      if (cur.children) stack.push(...cur.children);
    }
    return null;
  }

  function onDragEnd(result: DropResult) {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index)
      return;
    setFields(prev => {
      const rootClone = cloneFields(prev);
      const sourceArr = getArrayByDroppableId(
        rootClone,
        source.droppableId === "root" ? "root" : source.droppableId
      )!;
      const [moved] = sourceArr.splice(source.index, 1);
      const destArr = getArrayByDroppableId(
        rootClone,
        destination.droppableId === "root" ? "root" : destination.droppableId
      )!;
      destArr.splice(destination.index, 0, moved);
      return rootClone;
    });
  }

  function expandAll(value: boolean) {
    const map: Record<string, boolean> = {};
    function walk(list: FieldConfig[]) {
      for (const f of list) {
        if (f.type === "object") map[f.id] = !value ? true : false; // collapsed flag
        if (f.children) walk(f.children);
      }
    }
    walk(fields);
    setCollapsed(map);
  }

  return (
    <Stack h="100%" className="overflow-padding overflow-auto" gap="md" pb={6}>
      <Group justify="space-between">
        <Group gap="xs">
          <Text fw={600}>Data Faker</Text>
          <Badge variant="light" color="violet" size="sm">
            Experimental
          </Badge>
        </Group>
        <Group gap="xs" align="flex-end">
          <NumberInput
            w={120}
            label="Count"
            value={count}
            min={1}
            max={200}
            size="xs"
            onChange={e => setCount(Number(e))}
          />
          <SegmentedControl
            value={mode}
            onChange={setMode}
            data={[
              { label: "Pretty", value: "pretty" },
              { label: "Minified", value: "min" },
            ]}
            size="xs"
          />
          <Button
            size="xs"
            leftSection={<BsPlayFill size={14} />}
            variant="light"
            onClick={runGeneration}
          >
            Generate
          </Button>
        </Group>
      </Group>

      <Stack flex={1} h="100%" w="100%">
        <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false} h="100%">
          <Tabs.List>
            <Tabs.Tab value="builder" leftSection={<BsWrench size={14} />}>
              Builder
            </Tabs.Tab>
            <Tabs.Tab value="schema" leftSection={<BsBraces size={14} />}>
              JSON Schema
            </Tabs.Tab>
            <Tabs.Tab value="output" leftSection={<BsDownload size={14} />}>
              Output
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="builder" pt="md">
            <Stack gap="xs">
              <Group gap="xs" justify="space-between">
                <Group gap="xs">
                  <Button onClick={addField} variant="light" size="xs">
                    Add Field
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() =>
                      setFields(f => [
                        ...f,
                        {
                          id: faker.string.uuid(),
                          name: "objectField",
                          type: "object",
                          children: [],
                        },
                      ])
                    }
                  >
                    Add Object
                  </Button>
                </Group>
                <Group gap={4} wrap="nowrap">
                  <Button variant="subtle" size="xs" onClick={() => expandAll(true)}>
                    Expand All
                  </Button>
                  <Button variant="subtle" size="xs" onClick={() => expandAll(false)}>
                    Collapse All
                  </Button>
                </Group>
              </Group>
              <Alert
                variant="light"
                color="gray"
                styles={{
                  title: {
                    fontSize: "var(--mantine-font-size-xs)",
                    fontWeight: 450,
                  },
                }}
                title={
                  <span>
                    <b>Tip:</b> Drag to reorder. For nested objects, use Add Object then + Child.
                    Open preview to inspect object structure.
                  </span>
                }
              ></Alert>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="root" type="FIELD">
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ display: "flex", flexDirection: "column", width: "100%" }}
                    >
                      {fields.map((field, index) => (
                        <Draggable draggableId={field.id} index={index} key={field.id}>
                          {dragProvided => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                width: "100%",
                                boxSizing: "border-box",
                                marginTop: index === 0 ? 0 : 8,
                              }}
                            >
                              <FieldEditor
                                field={field}
                                dragHandleProps={dragProvided.dragHandleProps}
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
          </Tabs.Panel>
          <Tabs.Panel value="schema" pt="md" h="100%">
            <Stack gap="xs" h="100%">
              <Group justify="space-between">
                <Text size="sm" fw={500} c="dimmed">
                  JSON Schema
                </Text>
                <Badge color={schemaValid ? "green" : "red"}>
                  {schemaValid ? "Valid" : "Invalid"}
                </Badge>
              </Group>
              <Box
                h="100%"
                flex={1}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  overflow: "hidden",
                }}
              >
                <MonacoEditor
                  language="json"
                  value={jsonSchema}
                  setValue={v => setJsonSchema(v || "")}
                  height="100%"
                />
              </Box>
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="output" pt="md" h="100%">
            <Stack gap="xs" h="100%">
              <Group justify="space-between">
                <Text size="sm" fw={500} c="dimmed">
                  Output
                </Text>
                <Group gap={4}>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => navigator.clipboard.writeText(output)}
                  >
                    Copy
                  </Button>
                </Group>
              </Group>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  height: "100%",
                  borderRadius: "var(--mantine-radius-md)",
                  overflow: "hidden",
                }}
              >
                <MonacoEditor
                  language="json"
                  value={output}
                  height="100%"
                  extraOptions={{ readOnly: true, wordWrap: "on" }}
                />
              </div>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Stack>
  );
}
