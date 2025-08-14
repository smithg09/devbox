import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Group, Select, Stack, Text, Textarea } from "@mantine/core";
import { decodeJwt, decodeProtectedHeader, jwtVerify, SignJWT } from "jose";
import styles from "./JWT.module.css";

const JWTEditor = () => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [algorithm] = useState<string>("HS256");
  const [jwt, setJwt] = useState<string>("");
  const [header, setHeader] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [secretBase64, setSecretBase64] = useState<boolean>(false);

  const [secret, setSecret] = useState<string>("a-string-secret-at-least-256-bits-long");

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register custom language
    monaco.languages.register({ id: "jwt" });
    monaco.languages.setMonarchTokensProvider("jwt", {
      tokenizer: {
        root: [
          [/^[^.]+/, "jwt-header"],
          [/\./, "jwt-dot"],
          [/[^.]+(?=\.)/, "jwt-payload"],
          [/[^.]+$/, "jwt-signature"],
        ],
      },
    });

    import("monaco-themes/themes/Clouds Midnight.json").then((data: any) => {
      monaco.editor.defineTheme("jwtTheme", {
        base: "vs-dark",
        inherit: false,
        rules: [
          { token: "jwt-header", foreground: "fb015b" },
          { token: "jwt-payload", foreground: "d63aff" },
          { token: "jwt-signature", foreground: "00b9f1" },
          { token: "jwt-dot", foreground: "ffffff" },
          ...data.rules,
        ],
        colors: {
          ...data.colors,
        },
      });
      monaco.editor.setTheme("jwtTheme");
    });
  };

  const verifyJwt = async (secret: string) => {
    try {
      const key = new TextEncoder().encode(secret);
      await jwtVerify(jwt, key, { algorithms: [algorithm] });
      setIsVerified(true);
    } catch (e) {
      setIsVerified(false);
      console.log(e);
    }
  };

  useEffect(() => {
    (async () => {
      const jwt = await new SignJWT({
        name: "John Doe",
      })
        .setProtectedHeader({ alg: algorithm, typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .setSubject("1234567890")
        .sign(new TextEncoder().encode(secret));

      setJwt(jwt);
      await verifyJwt(secret);
    })();
    // Note: should be returned but throws an error when formatted
    () => {
      editorRef.current?.dispose();
      setJwt("");
    };
  }, [algorithm]);

  useEffect(() => {
    if (jwt) {
      const parts = jwt.split(".");
      if (parts.length === 3) {
        const [headerPart, payloadPart] = parts;

        try {
          const decodedPayload = decodeJwt(`${jwt}`);
          setPayload(JSON.stringify(decodedPayload, null, 2));
        } catch (e) {
          setPayload(payloadPart);
        }

        try {
          const decodedHeader = decodeProtectedHeader(jwt);
          setHeader(JSON.stringify(decodedHeader, null, 2));
        } catch (e) {
          setHeader(headerPart);
        }
      }
      (async () => {
        await verifyJwt(secret);
      })();
    }
  }, [jwt]);

  return (
    <Group className="overflow-padding" h="100%" w={"100%"} wrap="nowrap" align="start">
      <Stack h="100%" w="50%" gap={0} style={{ borderRadius: "8px", overflow: "hidden" }}>
        <div className={`${styles.statusIndicator} ${jwt ? styles.valid : styles.invalid}`}>
          {jwt ? "Valid JWT" : "Invalid JWT"}
        </div>
        <div
          className={`${styles.statusIndicator} ${!isVerified || !jwt ? styles.unverified : styles.verified}`}
        >
          {!isVerified || !jwt ? "Signature Unverified" : "Signature Verified"}
        </div>
        <Editor
          height="100%"
          width={"100%"}
          defaultLanguage="jwt"
          onChange={e => setJwt(e || "")}
          value={jwt}
          options={{
            fontSize: 18,
            minimap: { enabled: false },
            lineNumbers: "off",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            wordWrap: "on",
            padding: { top: 10 },
            wrappingStrategy: "advanced",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: { vertical: "hidden", horizontal: "hidden" },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
          }}
          onMount={handleEditorDidMount}
        />
      </Stack>
      <Stack h="100%" w="50%">
        <Text c="dimmed" size="sm">
          <strong>Decoded Header</strong>
          {/* Algorithm Type */}
          {/* <Select
            data={algorithms}
            value={algorithm}
            onChange={(e) => setAlgorithm(e as string)}
          /> */}
        </Text>
        <div
          className="editor__red"
          style={{
            height: "20%",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Editor
            path="header.json"
            height="100%"
            width="100%"
            defaultLanguage="json"
            defaultValue={header}
            value={header}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
            }}
          />
          <style>{`.editor__red * { color: #fb015b; }`}</style>
        </div>
        <Text c="dimmed" size="sm">
          <strong>Decoded Payload</strong>
        </Text>

        <div
          className="editor__purple"
          style={{
            height: "30%",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Editor
            path="payload.json"
            height="100%"
            width="100%"
            defaultLanguage="json"
            defaultValue={payload}
            value={payload}
            options={{
              minimap: { enabled: false },
              lineNumbers: "off",
              scrollBeyondLastLine: false,
            }}
          />
          <style>{`.editor__purple * { color: #d63aff; }`}</style>
        </div>

        <Text c="dimmed" size="sm">
          <strong>Secret</strong>
        </Text>
        <div style={{ borderRadius: "8px", overflow: "hidden" }}>
          <div
            className={`${styles.statusIndicator} ${!isVerified || !jwt ? styles.invalid : styles.valid}`}
          >
            {!isVerified || !jwt ? "Invalid secret" : "Valid secret"}
          </div>
          <Textarea
            minRows={3}
            maxRows={5}
            autosize
            value={secret}
            onChange={async e => {
              setSecret(e.target.value as string);
              await verifyJwt(e.target.value);
            }}
            className={styles.secretField}
            placeholder="Enter your secret"
          />
        </div>
        <Group display="flex" justify="flex-end" align="center">
          <Text c="dimmed" size="sm">
            Encoding Format
          </Text>
          <Select
            data={["UTF-8", "base64url"]}
            styles={{
              root: {
                width: "fit-content",
              },
            }}
            size="xs"
            value={secretBase64 ? "base64url" : "UTF-8"}
            onChange={e => {
              if (e === "base64url") {
                setSecretBase64(true);
              } else {
                setSecretBase64(false);
              }
            }}
          />
        </Group>
      </Stack>
    </Group>
  );
};

export default JWTEditor;
