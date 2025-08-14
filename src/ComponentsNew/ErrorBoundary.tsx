import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, Box, Button, Container, Stack, Text, Title } from "@mantine/core";
import { BsExclamationTriangle } from "react-icons/bs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Container size="md" h="100%" style={{ paddingTop: "2rem" }}>
            <Stack align="center" gap="md" justify="center">
              <Box style={{ textAlign: "center" }}>
                <BsExclamationTriangle size={48} color="var(--mantine-color-red-6)" />
              </Box>
              <Title order={2}>Something went wrong</Title>
              <Text c="dimmed" ta="center">
                An unexpected error occurred. Please try refreshing the page or contact support if
                the problem persists.
              </Text>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <Alert color="red" title="Error Details" style={{ width: "100%" }}>
                  <Text size="sm" ff="monospace">
                    {this.state.error.message}
                  </Text>
                </Alert>
              )}
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                variant="light"
              >
                Refresh Page
              </Button>
            </Stack>
          </Container>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
