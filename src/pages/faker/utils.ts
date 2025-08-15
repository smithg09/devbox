import { faker } from "@faker-js/faker";

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: any[];
  format?: string;
  examples?: any[];
}

export interface FieldConfig {
  id: string;
  name: string;
  type: string;
  children?: FieldConfig[];
  array?: boolean;
  arrayLength?: number;
}

export const primitiveTypes = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "uuid", label: "UUID" },
  { value: "date", label: "Date ISO" },
  { value: "email", label: "Email" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "fullName", label: "Full Name" },
  { value: "jobTitle", label: "Job Title" },
  { value: "phone", label: "Phone" },
  { value: "streetAddress", label: "Street Address" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "countryCode", label: "Country Code" },
  { value: "latitude", label: "Latitude" },
  { value: "longitude", label: "Longitude" },
  { value: "ip", label: "IP" },
  { value: "url", label: "URL" },
  { value: "domain", label: "Domain" },
  { value: "username", label: "Username" },
  { value: "password", label: "Password" },
  { value: "company", label: "Company" },
  { value: "avatar", label: "Avatar URL" },
  { value: "color", label: "Color" },
  { value: "currencyCode", label: "Currency Code" },
  { value: "iban", label: "IBAN" },
  { value: "bitcoinAddress", label: "Bitcoin Address" },
  { value: "sentence", label: "Sentence" },
  { value: "paragraph", label: "Paragraph" },
  { value: "imageUrl", label: "Image URL" },
  { value: "object", label: "Object" },
];

export function generateFromField(field: FieldConfig): any {
  if (field.array) {
    const len = field.arrayLength ?? 3;
    return Array.from({ length: len }, () => generateFromField({ ...field, array: false }));
  }
  if (field.type === "object") {
    return buildObject(field.children || []);
  }
  switch (field.type) {
    case "string":
      return faker.string.alpha({ length: { min: 5, max: 12 } });
    case "number":
      return faker.number.int({ min: 0, max: 1000 });
    case "boolean":
      return faker.datatype.boolean();
    case "uuid":
      return faker.string.uuid();
    case "date":
      return faker.date.recent().toISOString();
    case "email":
      return faker.internet.email();
    case "firstName":
      return faker.person.firstName();
    case "lastName":
      return faker.person.lastName();
    case "fullName":
      return faker.person.fullName();
    case "jobTitle":
      return faker.person.jobTitle();
    case "phone":
      return faker.phone.number();
    case "streetAddress":
      return faker.location.streetAddress();
    case "city":
      return faker.location.city();
    case "country":
      return faker.location.country();
    case "ip":
      return faker.internet.ip();
    case "url":
      return faker.internet.url();
    case "domain":
      return faker.internet.domainName?.() || faker.internet.domainWord?.();
    case "username":
      return (faker.internet as any).userName?.() || (faker.internet as any).username?.();
    case "password":
      return faker.internet.password();
    case "company":
      return faker.company.name();
    case "avatar":
      return (
        (faker.image as any).avatar?.() ||
        (faker.image as any).urlLoremFlickr?.() ||
        (faker.image as any).url?.()
      );
    case "color":
      return faker.color.human();
    case "latitude":
      return faker.location.latitude();
    case "longitude":
      return faker.location.longitude();
    case "countryCode":
      return faker.location.countryCode();
    case "currencyCode":
      return faker.finance.currencyCode();
    case "iban":
      return faker.finance.iban();
    case "bitcoinAddress":
      return faker.finance.bitcoinAddress();
    case "sentence":
      return faker.lorem.sentence();
    case "paragraph":
      return faker.lorem.paragraph();
    case "imageUrl":
      return (faker.image as any).url?.() || (faker.image as any).imageUrl?.();
    default:
      return null;
  }
}

export function buildObject(fields: FieldConfig[]): any {
  const obj: Record<string, any> = {};
  for (const f of fields) {
    obj[f.name] =
      f.children && f.children.length > 0 ? buildObject(f.children) : generateFromField(f);
  }
  return obj;
}

export function generateFromSchema(schema: JsonSchema): any {
  if (!schema) return null;
  if (schema.enum) return faker.helpers.arrayElement(schema.enum);
  switch (schema.type) {
    case "object": {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(schema.properties || {})) {
        result[k] = generateFromSchema(v);
      }
      return result;
    }
    case "array":
      return Array.from({ length: 3 }, () => generateFromSchema(schema.items || {}));
    case "string":
      if (schema.format === "date-time") return faker.date.recent().toISOString();
      return faker.lorem.word();
    case "number":
    case "integer":
      return faker.number.int({ min: 0, max: 1000 });
    case "boolean":
      return faker.datatype.boolean();
    default:
      return null;
  }
}
