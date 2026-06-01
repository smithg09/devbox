export type KeyValue = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

export interface GraphQLTab {
  id: string;
  title: string;
  endpoint: string;
  query: string;
  variables: string;
  headers: KeyValue[];
  operationName?: string;
  response?: {
    data?: any;
    errors?: any[];
    extensions?: any;
    duration: number;
    size: number;
  };
  schema?: any; // GraphQLSchema type from graphql package
  isLoading: boolean;
  lastError?: string;
}

export interface GraphQLState {
  tabs: GraphQLTab[];
  activeTabId: string;
  layout: "vertical" | "two-column" | "accordion";
}

export const DEFAULT_QUERY = `
# Welcome to DevBox GraphQL

query Languages {
  languages{
    code
    countries {
      awsRegion
      capital
      code
      currencies
      emoji
      name
      native
      phone
    }
    name
    native
    rtl

  }
}`;

export const DEFAULT_HEADERS: KeyValue[] = [
  {
    id: "auth-header",
    key: "Authorization",
    value: "Bearer ",
    enabled: false,
  },
  {
    id: crypto.randomUUID(),
    key: "",
    value: "",
    enabled: true,
  },
];
