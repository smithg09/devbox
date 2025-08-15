import { MonacoEditor } from "@/components/Monaco/Editor";
import { settingsStore } from "@/utils/store";
import { faker } from "@faker-js/faker";
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

  // ----------------------
  // Custom Drag & Drop State
  // ----------------------
  interface DragState {
    id: string; // field id being dragged
    initialX: number;
    initialY: number;
    offsetX: number; // pointer offset inside element
    offsetY: number;
    width: number;
    height: number;
    sourceParentId: string; // parent droppable id ("root" or field id)
    sourceIndex: number;
  }
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  // Helpers to walk / mutate field tree

  function removeFieldFromTree(
    list: FieldConfig[],
    id: string
  ): { removed: FieldConfig | null; tree: FieldConfig[] } {
    function walk(arr: FieldConfig[]): [FieldConfig[], FieldConfig | null] {
      const out: FieldConfig[] = [];
      let removed: FieldConfig | null = null;
      for (const f of arr) {
        if (f.id === id) {
          removed = f;
          continue;
        }
        if (f.children) {
          const [childArr, r] = walk(f.children);
          if (r) removed = r;
          out.push({ ...f, children: childArr });
        } else {
          out.push(f);
        }
      }
      return [out, removed];
    }
    const [newTree, removed] = walk(list);
    return { removed, tree: newTree };
  }

  function insertFieldIntoTree(
    list: FieldConfig[],
    parentId: string,
    index: number,
    node: FieldConfig
  ): FieldConfig[] {
    if (parentId === "root") {
      const clone = [...list];
      clone.splice(index, 0, node);
      return clone;
    }
    function walk(arr: FieldConfig[]): FieldConfig[] {
      return arr.map(f => {
        if (f.id === parentId) {
          const children = f.children ? [...f.children] : [];
          children.splice(index, 0, node);
          return { ...f, type: "object", children };
        }
        if (f.children) return { ...f, children: walk(f.children) };
        return f;
      });
    }
    return walk(list);
  }

  function moveField(dragId: string, destParentId: string, destIndex: number) {
    if (destIndex < 0) return;
    setFields(prev => {
      // Prevent dropping into itself or descendant
      if (dragId === destParentId) return prev;
      // Gather ancestor chain for dest to prevent circular moves
      function isDescendant(targetId: string, maybeDesc: string): boolean {
        if (targetId === maybeDesc) return true;
        const stack = [...prev];
        while (stack.length) {
          const n = stack.pop()!;
          if (n.id === targetId) {
            const checkStack = n.children ? [...n.children] : [];
            while (checkStack.length) {
              const c = checkStack.pop()!;
              if (c.id === maybeDesc) return true;
              if (c.children) checkStack.push(...c.children);
            }
            return false;
          }
          if (n.children) stack.push(...n.children);
        }
        return false;
      }
      if (isDescendant(dragId, destParentId)) return prev;
      const { removed, tree } = removeFieldFromTree(prev, dragId);
      if (!removed) return prev;
      return insertFieldIntoTree(tree, destParentId, destIndex, removed);
    });
  }

  function getRootContainer(): HTMLElement | null {
    return document.querySelector<HTMLElement>("[data-droppable-id='root']");
  }
  function getRootDraggables(): HTMLElement[] {
    const root = getRootContainer();
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-dnd-id]"));
  }

  function startDrag(id: string, e: React.MouseEvent) {
    e.preventDefault();
    const el = document.querySelector<HTMLElement>(`[data-dnd-id='${id}']`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parentId = "root";
    const siblings = getRootDraggables();
    const sourceIndex = siblings.indexOf(el);
    if (sourceIndex === -1) return;
    setDragState({
      id,
      initialX: rect.left,
      initialY: rect.top,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      sourceParentId: parentId,
      sourceIndex,
    });
    setDragOverIndex(sourceIndex);
    document.body.classList.add("dnd-grabbing");
  }

  // Effect: attach listeners for active drag
  useEffect(() => {
    if (!dragState) return;
    const current = dragState;
    function onMove(ev: MouseEvent) {
      if (dragGhostRef.current) {
        const x = ev.clientX;
        const y = ev.clientY;
        dragGhostRef.current.style.transform = `translate(${x - current.offsetX}px, ${y - current.offsetY}px)`;
      }
      const items = getRootDraggables();
      let index = items.length;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (ev.clientY < mid) {
          index = i;
          break;
        }
      }
      setDragOverIndex(index);
    }
    function onUp() {
      if (dragState && dragOverIndex > -1) moveField(dragState.id, "root", dragOverIndex);
      setDragState(null);
      setDragOverIndex(-1);
      document.body.classList.remove("dnd-grabbing");
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState, dragOverIndex]);

  // Drag ghost element
  useEffect(() => {
    if (dragState) {
      const original = document.querySelector<HTMLElement>(`[data-dnd-id='${dragState.id}']`);
      if (!original) return;
      const ghost = original.cloneNode(true) as HTMLDivElement;
      ghost.style.pointerEvents = "none";
      ghost.style.position = "fixed";
      ghost.style.top = "0";
      ghost.style.left = "0";
      ghost.style.width = dragState.width + "px";
      ghost.style.height = dragState.height + "px";
      ghost.style.zIndex = "9999";
      ghost.style.opacity = "0.85";
      ghost.style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)";
      ghost.classList.add("drag-ghost");
      document.body.appendChild(ghost);
      dragGhostRef.current = ghost;
      return () => {
        ghost.remove();
        dragGhostRef.current = null;
      };
    }
  }, [dragState]);

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

  const FieldEditor = ({ field, depth = 0 }: FieldEditorProps) => {
    const isObject = field.type === "object";
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
              {depth === 0 && (
                <ActionIcon
                  size="md"
                  variant="subtle"
                  aria-label="drag-handle"
                  style={{ cursor: dragState ? "grabbing" : "grab", alignSelf: "center" }}
                  onMouseDown={e => startDrag(field.id, e)}
                >
                  <BsArrowsMove size={14} />
                </ActionIcon>
              )}
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
          {isObject && !isCollapsed && field.children?.length ? (
            <div style={{ display: "flex", flexDirection: "column", paddingLeft: 4, marginTop: 6 }}>
              {field.children.map((c, idx) => (
                <div key={c.id} style={{ marginTop: idx === 0 ? 0 : 6 }}>
                  <FieldEditor field={c} depth={depth + 1} />
                </div>
              ))}
            </div>
          ) : null}
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
                    <b>Tip:</b> Drag top-level items to reorder only.
                    <br />
                    Use Add Object then + Child buttons to manage nesting; dragging into nested
                    levels is disabled.
                  </span>
                }
              />
              <div
                data-droppable-id="root"
                style={{ display: "flex", flexDirection: "column", width: "100%" }}
              >
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    data-dnd-id={field.id}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: index === 0 ? 0 : 8,
                      position: "relative",
                    }}
                  >
                    {dragState && dragOverIndex === index && (
                      <div
                        style={{
                          position: "absolute",
                          top: -6,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "var(--mantine-color-blue-5)",
                          borderRadius: 2,
                        }}
                      />
                    )}
                    <FieldEditor field={field} />
                  </div>
                ))}
                {dragState && dragOverIndex === fields.length && (
                  <div
                    style={{
                      height: 4,
                      background: "var(--mantine-color-blue-5)",
                      borderRadius: 2,
                      marginTop: 8,
                    }}
                  />
                )}
              </div>
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
