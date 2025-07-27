import { useState, useEffect } from "react";
import {
  TextInput,
  Button,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Alert,
  Progress,
  ActionIcon,
  Tooltip,
  CopyButton,
  SimpleGrid,
  Box,
  Select,
  Flex,
} from "@mantine/core";
import { BsSearch, BsTrash, BsDownload, BsGithub, BsCheck, BsCopy } from "react-icons/bs";
import { notifications } from "@mantine/notifications";

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  gzip: number;
  dependencies?: DependencyInfo[];
  level: number;
}

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  size: number; // estimated
  gzip: number; // estimated
  dependencyCount: number;
  hasJSModule: boolean;
  hasJSNext: boolean;
  hasSideEffects: boolean;
  repository?: string;
  homepage?: string;
  dependencies?: DependencyInfo[];
  unpackedSize?: number;
  tarballSize?: number;
  keywords?: string[];
  license?: string;
  lastPublished?: string;
  dependencyTree?: { [key: string]: DependencyInfo };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getSizeColor = (size: number): string => {
  if (size < 50000) return "green"; // < 50KB
  if (size < 200000) return "yellow"; // < 200KB
  if (size < 500000) return "orange"; // < 500KB
  return "red"; // >= 500KB
};

const DependencyTreeMap = ({ packages, title }: { packages: DependencyInfo[]; title: string }) => {
  if (!packages || packages.length === 0) return null;

  // Calculate total size including nested dependencies
  const calculateTotalSize = (pkg: DependencyInfo): number => {
    let total = pkg.size;
    if (pkg.dependencies) {
      total += pkg.dependencies.reduce((sum, dep) => sum + calculateTotalSize(dep), 0);
    }
    return total;
  };

  const packagesWithNestedSizes = packages.map(pkg => ({
    ...pkg,
    totalSize: calculateTotalSize(pkg),
  }));

  const grandTotalSize = packagesWithNestedSizes.reduce((sum, pkg) => sum + pkg.totalSize, 0);

  // Enhanced color scheme for different levels
  const getEnhancedBoxColor = (size: number, level: number = 0, baseHue: number = 210): string => {
    const saturation = Math.max(30, 70 - level * 15);
    const lightness = Math.max(35, 65 - level * 10);

    if (size > 50000) return `hsl(${baseHue}, ${saturation}%, ${lightness - 10}%)`;
    if (size > 20000) return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    return `hsl(${baseHue}, ${saturation}%, ${lightness + 10}%)`;
  };

  const getHueForLevel = (level: number): number => {
    const hues = [210, 142, 25, 0, 270]; // Blue, Green, Orange, Red, Purple
    return hues[Math.min(level, hues.length - 1)];
  };

  const renderNestedTreeMapBox = (
    pkg: DependencyInfo & { totalSize: number },
    level: number = 0
  ) => {
    const percentage = (pkg.totalSize / grandTotalSize) * 100;
    // Adjust flex basis for wrapping - aim for roughly 5-6 boxes per row
    const flexBasis = Math.max(Math.min(percentage * 0.8, 18), 12); // Between 12% and 18% width
    const hasNested = pkg.dependencies && pkg.dependencies.length > 0;
    const baseHue = getHueForLevel(level);

    return (
      <Tooltip
        key={`${pkg.name}-${level}`}
        label={
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              {pkg.name}
            </Text>
            <Text size="xs">v{pkg.version}</Text>
            <Text size="xs">Direct Size: {formatBytes(pkg.size)}</Text>
            <Text size="xs">Total Size: {formatBytes(pkg.totalSize)}</Text>
            <Text size="xs">Gzipped: {formatBytes(pkg.gzip)}</Text>
            <Text size="xs">{percentage.toFixed(1)}% of total bundle</Text>
            <Text size="xs">Depth Level: {level}</Text>
            {hasNested && (
              <Text size="xs" c="dimmed">
                {pkg.dependencies!.length} nested{" "}
                {pkg.dependencies!.length === 1 ? "dependency" : "dependencies"}
              </Text>
            )}
          </Stack>
        }
        position="top"
        withArrow
      >
        <Box
          style={{
            flex: `0 0 ${flexBasis}%`,
            minHeight: `${Math.max(60 + level * 8, 60)}px`,
            flexGrow: 1,
            backgroundColor: getEnhancedBoxColor(pkg.totalSize, level, baseHue),
            border: `2px solid ${getEnhancedBoxColor(pkg.totalSize, level, baseHue).replace(")", ", 0.8)")}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: hasNested ? "flex-start" : "center",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            padding: "6px",
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 2px 6px rgba(0,0,0,${0.1 + level * 0.05})`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.zIndex = "10";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.zIndex = "1";
          }}
        >
          {/* Package header */}
          <Box style={{ textAlign: "center", marginBottom: hasNested ? "4px" : "0" }}>
            <Text
              size={level === 0 ? "xs" : "xs"}
              fw={level === 0 ? 700 : 600}
              c="white"
              style={{
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                wordBreak: "break-word",
                lineHeight: 1.1,
              }}
              lineClamp={1}
            >
              {pkg.name}
            </Text>
            <Text
              size="xs"
              c="white"
              style={{
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                marginTop: "1px",
              }}
            >
              {formatBytes(pkg.totalSize)}
            </Text>
            {percentage >= 8 && (
              <Text
                size="xs"
                c="white"
                style={{
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  marginTop: "1px",
                }}
              >
                {percentage.toFixed(1)}%
              </Text>
            )}
          </Box>

          {/* Nested dependencies area */}
          {hasNested && level < 2 && (
            <Box
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                marginTop: "auto",
              }}
            >
              {pkg
                .dependencies!.sort((a, b) => b.size - a.size)
                .slice(0, level === 0 ? 6 : 3)
                .map(nestedDep => (
                  <Box
                    key={nestedDep.name}
                    style={{
                      minWidth: "24px",
                      maxWidth: "48px",
                      height: "20px",
                      backgroundColor: getEnhancedBoxColor(
                        nestedDep.size,
                        level + 1,
                        getHueForLevel(level + 1)
                      ),
                      borderRadius: "2px",
                      border: "1px solid rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "1",
                    }}
                  >
                    <Text
                      size="xs"
                      c="white"
                      fw={500}
                      style={{
                        textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
                        fontSize: "8px",
                        lineHeight: 1,
                      }}
                      lineClamp={1}
                    >
                      {nestedDep.name.slice(0, 4)}
                    </Text>
                  </Box>
                ))}
              {pkg.dependencies!.length > (level === 0 ? 6 : 3) && (
                <Badge
                  size="xs"
                  variant="filled"
                  color="dark"
                  style={{
                    fontSize: "7px",
                    height: "14px",
                    minWidth: "18px",
                    opacity: 0.8,
                  }}
                >
                  +{pkg.dependencies!.length - (level === 0 ? 6 : 3)}
                </Badge>
              )}
            </Box>
          )}

          {/* Level indicator */}
          <Badge
            size="xs"
            variant="filled"
            color="dark"
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              fontSize: "7px",
              minWidth: "14px",
              height: "14px",
              opacity: 0.7,
            }}
          >
            L{level}
          </Badge>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box>
      <Text size="sm" fw={600} mb="xs" ta="center">
        {title}
      </Text>
      <Text size="xs" c="dimmed" mb="md" ta="center">
        Enhanced treemap showing nested dependencies (hover for details)
      </Text>

      {/* Legend */}
      <Group justify="center" mb="sm" gap="md">
        <Group gap="xs">
          <Box
            w={12}
            h={12}
            style={{ background: getEnhancedBoxColor(50000, 0, 210), borderRadius: "2px" }}
          />
          <Text size="xs">Level 0</Text>
        </Group>
        <Group gap="xs">
          <Box
            w={12}
            h={12}
            style={{ background: getEnhancedBoxColor(50000, 1, 142), borderRadius: "2px" }}
          />
          <Text size="xs">Level 1</Text>
        </Group>
      </Group>

      <Box
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0px",
          border: "1px solid var(--mantine-color-gray-3)",
          minHeight: "200px",
          backgroundColor: "var(--mantine-color-gray-0)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {packagesWithNestedSizes
          .sort((a, b) => b.totalSize - a.totalSize)
          .map(pkg => renderNestedTreeMapBox(pkg, 0))}
      </Box>
    </Box>
  );
};

const NestedTreeMap = ({ packageInfo }: { packageInfo: PackageInfo }) => {
  if (!packageInfo.dependencies || packageInfo.dependencies.length === 0) return null;

  const mainPackageSize = packageInfo.size;
  const dependenciesSize = packageInfo.dependencies.reduce((sum, dep) => sum + dep.size, 0);
  const totalSize = mainPackageSize + dependenciesSize;

  return (
    <Card withBorder p="md">
      <Text size="lg" fw={600} mb="md">
        Bundle Size Visualization
      </Text>

      <Box style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Main package box */}
        <Box>
          <Text size="sm" fw={600} mb="xs" ta="center">
            {packageInfo.name} (Main Package)
          </Text>
          <Tooltip
            label={
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  {packageInfo.name}
                </Text>
                <Text size="xs">v{packageInfo.version}</Text>
                <Text size="xs">Size: {formatBytes(packageInfo.size)}</Text>
                <Text size="xs">Gzipped: {formatBytes(packageInfo.gzip)}</Text>
                <Text size="xs">{((packageInfo.size / totalSize) * 100).toFixed(1)}% of total</Text>
              </Stack>
            }
          >
            <Box
              style={{
                width: "100%",
                height: "60px",
                backgroundColor: "var(--mantine-color-blue-6)",
                border: "2px solid var(--mantine-color-blue-8)",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Stack gap="xs" align="center">
                <Text
                  size="sm"
                  fw={700}
                  c="white"
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}
                >
                  {packageInfo.name}
                </Text>
                <Text size="xs" c="white" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}>
                  {formatBytes(packageInfo.size)} (
                  {((packageInfo.size / totalSize) * 100).toFixed(1)}%)
                </Text>
              </Stack>
            </Box>
          </Tooltip>
        </Box>

        {/* Dependencies treemap */}
        <DependencyTreeMap packages={packageInfo.dependencies} title="Dependencies" />

        {/* Size breakdown */}
        <SimpleGrid cols={3} spacing="md">
          <Flex direction="column" align="center" ta="center">
            <Text size="xs" c="dimmed" mb="xs">
              Main Package
            </Text>
            <Badge size="lg" color="blue">
              {formatBytes(packageInfo.size)}
            </Badge>
            <Text size="xs" c="dimmed" mt="xs">
              {((packageInfo.size / totalSize) * 100).toFixed(1)}%
            </Text>
          </Flex>
          <Flex direction="column" align="center" ta="center">
            <Text size="xs" c="dimmed" mb="xs">
              Dependencies
            </Text>
            <Badge size="lg" color="orange">
              {formatBytes(dependenciesSize)}
            </Badge>
            <Text size="xs" c="dimmed" mt="xs">
              {((dependenciesSize / totalSize) * 100).toFixed(1)}%
            </Text>
          </Flex>
          <Flex direction="column" align="center" ta="center">
            <Text size="xs" c="dimmed" mb="xs">
              Total Bundle
            </Text>
            <Badge size="lg" color={getSizeColor(totalSize)}>
              {formatBytes(totalSize)}
            </Badge>
            <Text size="xs" c="dimmed" mt="xs">
              100%
            </Text>
          </Flex>
        </SimpleGrid>
      </Box>
    </Card>
  );
};

const DependencyTreeView = ({
  dependencies,
  level = 0,
}: {
  dependencies: DependencyInfo[];
  level?: number;
}) => {
  if (!dependencies || dependencies.length === 0) {
    return null;
  }

  const getLevelColor = (level: number): string => {
    const colors = ["blue", "green", "orange", "red", "purple"];
    return colors[Math.min(level, colors.length - 1)];
  };

  const calculateTotalSize = (pkg: DependencyInfo): number => {
    let total = pkg.size;
    if (pkg.dependencies) {
      total += pkg.dependencies.reduce((sum, dep) => sum + calculateTotalSize(dep), 0);
    }
    return total;
  };

  return (
    <Stack gap="xs" style={{ marginLeft: level * 20 }}>
      {dependencies
        .sort((a, b) => calculateTotalSize(b) - calculateTotalSize(a))
        .map(dep => {
          const totalSize = calculateTotalSize(dep);
          const hasNested = dep.dependencies && dep.dependencies.length > 0;
          const levelColor = getLevelColor(level);

          return (
            <Box key={`${dep.name}-${level}`}>
              <Group
                justify="space-between"
                p="md"
                style={{
                  borderRadius: "8px",
                  backgroundColor:
                    level % 2 === 0
                      ? "var(--mantine-color-gray-0)"
                      : `var(--mantine-color-${levelColor}-0)`,
                  borderLeft: `4px solid var(--mantine-color-${levelColor}-5)`,
                  border: `1px solid var(--mantine-color-${levelColor}-2)`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                  color: "var(--mantine-color-gray-9)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateX(0px)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <Box style={{ flex: 1 }}>
                  <Group gap="sm" mb="xs">
                    <Text size="sm" fw={level === 0 ? 700 : 600}>
                      {dep.name}
                    </Text>
                    <Badge size="xs" variant="light" color={levelColor}>
                      v{dep.version}
                    </Badge>
                    <Badge size="xs" variant="outline" color="gray">
                      L{level}
                    </Badge>
                    {hasNested && (
                      <Badge size="xs" variant="dot" color={levelColor}>
                        +{dep.dependencies!.length} deps
                      </Badge>
                    )}
                  </Group>

                  <Group gap="md">
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        Direct:
                      </Text>
                      <Badge size="sm" color={getSizeColor(dep.size)}>
                        {formatBytes(dep.size)}
                      </Badge>
                    </Group>
                    {hasNested && (
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          Total:
                        </Text>
                        <Badge size="sm" variant="light" color={getSizeColor(totalSize)}>
                          {formatBytes(totalSize)}
                        </Badge>
                      </Group>
                    )}
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        Gzipped:
                      </Text>
                      <Badge size="sm" variant="outline" color={getSizeColor(dep.gzip)}>
                        {formatBytes(dep.gzip)}
                      </Badge>
                    </Group>
                  </Group>
                </Box>
              </Group>

              {hasNested && level < 3 && (
                <Box mt="xs">
                  <DependencyTreeView dependencies={dep.dependencies!} level={level + 1} />
                </Box>
              )}

              {hasNested && level >= 3 && (
                <Box mt="xs" ml="md">
                  <Text size="xs" c="dimmed" fs="italic">
                    ... {dep.dependencies!.length} more nested dependencies (max depth reached)
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
    </Stack>
  );
};

export default function Bundlephobia() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<PackageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(2); // Configurable dependency depth

  // Cache for dependency info to avoid duplicate fetches
  const [dependencyCache, setDependencyCache] = useState<{ [key: string]: DependencyInfo }>({});

  // Clear cache when depth changes to ensure fresh analysis
  useEffect(() => {
    setDependencyCache({});
  }, [maxDepth]);

  const fetchDependencyInfo = async (
    packageName: string,
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<DependencyInfo | null> => {
    if (currentDepth >= maxDepth) return null;

    // Check cache first
    const cacheKey = `${packageName}@${currentDepth}`;
    if (dependencyCache[cacheKey]) {
      return dependencyCache[cacheKey];
    }

    try {
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
      if (!response.ok) return null;

      const data = await response.json();
      const latestVersion = data["dist-tags"]?.latest;
      if (!latestVersion) return null;

      const versionData = data.versions[latestVersion];
      const unpackedSize = versionData.dist?.unpackedSize || versionData.dist?.size * 3 || 15000;

      // Better size estimation based on depth and package type
      let sizeMultiplier: number;
      if (currentDepth === 0) {
        sizeMultiplier = 0.4; // Main dependencies
      } else if (currentDepth === 1) {
        sizeMultiplier = 0.25; // Second level
      } else {
        sizeMultiplier = 0.15; // Third level and beyond
      }

      const estimatedSize = Math.floor(unpackedSize * sizeMultiplier);
      const estimatedGzip = Math.floor(estimatedSize * 0.3);

      // Recursively fetch nested dependencies with better limits
      const nestedDependencies: DependencyInfo[] = [];
      if (currentDepth < maxDepth - 1) {
        const depNames = Object.keys(versionData.dependencies || {});
        let limitPerLevel: number;

        if (currentDepth === 0) {
          limitPerLevel = 10; // More for first level
        } else if (currentDepth === 1) {
          limitPerLevel = 6; // Moderate for second level
        } else {
          limitPerLevel = 3; // Few for deeper levels
        }

        const selectedDeps = depNames.slice(0, limitPerLevel);

        // Fetch dependencies in batches to avoid overwhelming the API
        const batchSize = 3;
        for (let i = 0; i < selectedDeps.length; i += batchSize) {
          const batch = selectedDeps.slice(i, i + batchSize);
          const batchPromises = batch.map(depName =>
            fetchDependencyInfo(depName, maxDepth, currentDepth + 1)
          );
          const batchResults = await Promise.all(batchPromises);
          nestedDependencies.push(
            ...batchResults.filter((dep): dep is DependencyInfo => dep !== null)
          );

          // Small delay between batches to be nice to npm registry
          if (i + batchSize < selectedDeps.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      const depInfo: DependencyInfo = {
        name: packageName,
        version: latestVersion,
        size: estimatedSize,
        gzip: estimatedGzip,
        level: currentDepth,
        dependencies: nestedDependencies.length > 0 ? nestedDependencies : undefined,
      };

      // Update cache with depth-specific key
      setDependencyCache(prev => ({ ...prev, [cacheKey]: depInfo }));

      return depInfo;
    } catch (err) {
      console.warn(`Failed to fetch dependency info for ${packageName}:`, err);
      return null;
    }
  };

  const fetchPackageInfo = async (packageName: string): Promise<PackageInfo | null> => {
    try {
      // Fetch from npm registry API
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);

      if (!response.ok) {
        throw new Error(`Package "${packageName}" not found`);
      }

      const data = await response.json();
      const latestVersion = data["dist-tags"]?.latest;

      if (!latestVersion) {
        throw new Error(`No latest version found for "${packageName}"`);
      }

      const versionData = data.versions[latestVersion];

      // Estimate bundle size based on tarball size and unpacked size
      const tarballSize = versionData.dist?.unpackedSize || versionData.dist?.size || 0;
      const unpackedSize = versionData.dist?.unpackedSize || tarballSize * 3; // Rough estimate

      // Estimate minified size (roughly 30-40% of unpacked for JS packages)
      const estimatedMinifiedSize = Math.floor(unpackedSize * 0.35);
      // Estimate gzipped size (roughly 25-30% of minified)
      const estimatedGzipSize = Math.floor(estimatedMinifiedSize * 0.28);

      // Check for modern JS features
      const hasESModule = !!(
        versionData.module ||
        versionData.exports ||
        (versionData.main && versionData.main.includes(".mjs"))
      );
      const hasJSNext = !!(versionData.esnext || versionData["jsnext:main"]);
      const hasSideEffects = versionData.sideEffects !== false;

      // Count dependencies
      const dependencies = Object.keys(versionData.dependencies || {});
      const dependencyCount = dependencies.length;

      // Fetch dependency information with configurable depth analysis
      const dependencyInfoPromises = dependencies.slice(0, 15).map(
        dep => fetchDependencyInfo(dep, maxDepth, 0) // Use configurable maxDepth
      );

      const dependencyInfos = await Promise.all(dependencyInfoPromises);
      const validDependencies = dependencyInfos.filter(
        (dep): dep is DependencyInfo => dep !== null
      );

      return {
        name: data.name,
        version: latestVersion,
        description: data.description || versionData.description || "No description available",
        size: estimatedMinifiedSize,
        gzip: estimatedGzipSize,
        dependencyCount,
        hasJSModule: hasESModule,
        hasJSNext: hasJSNext,
        hasSideEffects: hasSideEffects,
        repository: data.repository?.url || versionData.repository?.url,
        homepage: data.homepage || versionData.homepage,
        unpackedSize: unpackedSize,
        tarballSize: tarballSize,
        keywords: data.keywords || [],
        license: data.license || versionData.license || "Unknown",
        lastPublished: data.time?.[latestVersion],
        dependencies: validDependencies,
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to fetch package information");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      notifications.show({
        title: "Invalid Input",
        message: "Please enter a package name",
        color: "red",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const packageInfo = await fetchPackageInfo(searchQuery.trim());

      if (packageInfo) {
        setCurrentPackage(packageInfo);
        notifications.show({
          title: "Package Analyzed",
          message: `${packageInfo.name} has been analyzed successfully`,
          color: "green",
          icon: <BsCheck />,
        });
        setSearchQuery("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch package information");
      notifications.show({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to fetch package information",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setCurrentPackage(null);
    setError(null);
  };

  const copyInstallCommand = (packageName: string) => {
    return `npm install ${packageName}`;
  };

  const calculateTotalSize = (pkg: PackageInfo): number => {
    const calculateDepsSize = (deps?: DependencyInfo[]): number => {
      if (!deps) return 0;
      return deps.reduce((sum, dep) => {
        return sum + dep.size + calculateDepsSize(dep.dependencies);
      }, 0);
    };
    return pkg.size + calculateDepsSize(pkg.dependencies);
  };

  return (
    <Stack className="overflow-padding" gap="lg" style={{ overflow: "scroll" }}>
      <Group gap="sm" align="end">
        <TextInput
          flex={1}
          placeholder="Enter package name (e.g., lodash, react, axios)"
          description="Name of the npm package"
          value={searchQuery}
          onChange={e => setSearchQuery(e.currentTarget.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          leftSection={<BsSearch />}
          label="Package Name"
        />
        <Select
          label="Analysis Depth"
          description="How deep to analyze dependencies"
          value={maxDepth.toString()}
          onChange={value => setMaxDepth(parseInt(value || "2"))}
          data={[
            { value: "1", label: "1 Level (Direct only)" },
            { value: "2", label: "2 Levels (+ Sub-deps)" },
          ]}
          w={200}
        />
        <Button onClick={handleSearch} loading={loading} variant="light" leftSection={<BsSearch />}>
          Analyze
        </Button>
        {currentPackage && (
          <Button variant="outline" color="red" onClick={clearAnalysis} leftSection={<BsTrash />}>
            Clear
          </Button>
        )}
      </Group>
      {loading && (
        <Text size="sm" c="dimmed" mt="xs">
          Fetching package info and building dependency tree (depth: {maxDepth})...
        </Text>
      )}
      <Text size="xs" c="orange">
        ⚠️ Bundle sizes are estimates based on package metadata and may not reflect actual
        minified/gzipped sizes.
      </Text>

      {/* Search Section */}

      {/* Error Alert */}
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      {/* Package Analysis */}
      {currentPackage && (
        <Stack gap="lg">
          {/* Main Package Info */}
          <Card withBorder p="md">
            <Group justify="space-between" mb="md">
              <div>
                <Text size="xl" fw={700} mb="xs">
                  {currentPackage.name}
                </Text>
                <Text size="sm" c="dimmed">
                  v{currentPackage.version} • {currentPackage.license}
                </Text>
              </div>
              <Group gap="xs">
                <CopyButton value={copyInstallCommand(currentPackage.name)}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy install command"}>
                      <ActionIcon variant="subtle" onClick={copy} color={copied ? "green" : "gray"}>
                        {copied ? <BsCheck /> : <BsCopy />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>

                {currentPackage.repository && (
                  <Tooltip label="View on GitHub">
                    <ActionIcon
                      variant="subtle"
                      component="a"
                      href={currentPackage.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BsGithub />
                    </ActionIcon>
                  </Tooltip>
                )}

                <Tooltip label="View on npm">
                  <ActionIcon
                    variant="subtle"
                    component="a"
                    href={`https://www.npmjs.com/package/${currentPackage.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BsDownload />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {currentPackage.description && (
              <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                {currentPackage.description}
              </Text>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="md">
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Est. Bundle Size
                </Text>
                <Badge size="lg" color={getSizeColor(currentPackage.size)}>
                  {formatBytes(currentPackage.size)}
                </Badge>
                <Progress
                  value={Math.min((currentPackage.size / 1000000) * 100, 100)}
                  color={getSizeColor(currentPackage.size)}
                  size="sm"
                  mt="xs"
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">
                  Est. Gzipped
                </Text>
                <Badge size="lg" color={getSizeColor(currentPackage.gzip)}>
                  {formatBytes(currentPackage.gzip)}
                </Badge>
                <Progress
                  value={Math.min((currentPackage.gzip / 300000) * 100, 100)}
                  color={getSizeColor(currentPackage.gzip)}
                  size="sm"
                  mt="xs"
                />
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">
                  Total with Deps
                </Text>
                <Badge size="lg" color={getSizeColor(calculateTotalSize(currentPackage))}>
                  {formatBytes(calculateTotalSize(currentPackage))}
                </Badge>
              </div>

              <div>
                <Text size="sm" fw={500} mb="xs">
                  Dependencies
                </Text>
                <Badge size="lg" variant="light">
                  {currentPackage.dependencyCount}
                </Badge>
              </div>
            </SimpleGrid>

            {/* Package Features */}
            <Group gap="xs" mb="md">
              {currentPackage.hasJSModule && (
                <Badge size="sm" variant="light" color="green">
                  ES Module
                </Badge>
              )}
              {currentPackage.hasJSNext && (
                <Badge size="sm" variant="light" color="blue">
                  JS Next
                </Badge>
              )}
              {!currentPackage.hasSideEffects && (
                <Badge size="sm" variant="light" color="green">
                  Tree-shakable
                </Badge>
              )}
            </Group>

            {/* Keywords */}
            {currentPackage.keywords && currentPackage.keywords.length > 0 && (
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Keywords:
                </Text>
                <Group gap="xs">
                  {currentPackage.keywords.slice(0, 5).map(keyword => (
                    <Badge key={keyword} size="xs" variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                  {currentPackage.keywords.length > 5 && (
                    <Badge size="xs" variant="outline" c="dimmed">
                      +{currentPackage.keywords.length - 5} more
                    </Badge>
                  )}
                </Group>
              </div>
            )}
          </Card>

          {/* Bundle Size Visualization */}
          <NestedTreeMap packageInfo={currentPackage} />

          {/* Dependency Visualization */}
          {currentPackage.dependencies && currentPackage.dependencies.length > 0 && (
            <Card withBorder p="md">
              <Group justify="space-between" mb="md">
                <Text size="lg" fw={600}>
                  Dependencies ({currentPackage.dependencies.length} direct)
                </Text>
              </Group>

              <Box style={{ maxHeight: "600px", overflowY: "auto" }}>
                <DependencyTreeView dependencies={currentPackage.dependencies} />
              </Box>
            </Card>
          )}
        </Stack>
      )}
    </Stack>
  );
}
