import { request } from "@stacks/connect";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";

type NetworkKind = "testnet" | "mainnet";

interface BtcUniSettings {
  net: NetworkKind;
  ca: string;
  cn: string;
  ftCa?: string;
  ftCn?: string;
  oracleCa?: string;
  oracleCn?: string;
}

const SETTINGS_KEY = "merchant-settings";

function getPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setPersisted<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const state: BtcUniSettings = (() => {
  const saved = getPersisted<Partial<BtcUniSettings>>(SETTINGS_KEY, {});
  return {
    net: (saved.net as NetworkKind) || "testnet",
    ca: saved.ca || "STHJGT945DGCQH08X9KB04V2DBHERWTQZCN5BVJS",
    cn: saved.cn || "btc-university",
    ftCa: saved.ftCa || "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
    ftCn: saved.ftCn || "sbtc-token",
    oracleCa: saved.oracleCa || "",
    oracleCn: saved.oracleCn || "",
  };
})();

function getNetwork() {
  return state.net === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
}

function toUintFromSbtc(amountStr: string): bigint {
  const trimmed = amountStr.trim();
  if (!trimmed) throw new Error("Amount required");
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "00000000").slice(0, 8);
  const normalized = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  if (!/^\d+$/.test(normalized)) throw new Error("Invalid amount");
  return BigInt(normalized || "0");
}

let selectedAddress: string | null = null;
function getSenderAddress(): string | null {
  return selectedAddress;
}

function pickAddressForNetwork(
  addresses: any[],
  net: NetworkKind
): string | null {
  console.log("Picking address for network:", net);
  console.log("Input addresses:", addresses);

  if (!Array.isArray(addresses)) {
    console.log("Invalid addresses input - not an array");
    return null;
  }

  // Look for Stacks address that starts with ST (testnet/mainnet)
  for (const addr of addresses) {
    console.log("Processing address:", addr);

    if (!addr) {
      console.log("Skipping null/undefined address");
      continue;
    }

    // Check if this address object has a Stacks address
    const stacksAddr = addr.address || addr.stxAddress || addr;
    console.log("Extracted Stacks address:", stacksAddr);

    if (
      typeof stacksAddr === "string" &&
      /^S[TP][0-9A-Z]{38,39}$/.test(stacksAddr)
    ) {
      // Verify network matches if specified in address object
      if (addr.network && addr.network !== net) {
        console.log("Network mismatch - skipping address");
        continue;
      }
      console.log("Found valid Stacks address:", stacksAddr);
      return stacksAddr;
    }

    // Handle nested address structure
    if (typeof addr === "object" && addr.stxAddress) {
      console.log("Found nested address structure");
      const nestedAddr =
        addr.stxAddress[net] ||
        addr.stxAddress.testnet ||
        addr.stxAddress.mainnet;
      console.log("Extracted nested address:", nestedAddr);

      if (
        typeof nestedAddr === "string" &&
        /^S[TP][0-9A-Z]{38,39}$/.test(nestedAddr)
      ) {
        console.log("Found valid nested Stacks address:", nestedAddr);
        return nestedAddr;
      }
    }
  }

  console.log("No valid Stacks address found");
  return null;
}

async function getOrFetchAddress(): Promise<string> {
  if (selectedAddress) return selectedAddress;
  const res = await request("stx_getAddresses");
  console.log("Debug - stx_getAddresses response:", res);
  const addr = pickAddressForNetwork((res as any)?.addresses, state.net);
  console.log("Debug - picked address for network", state.net, ":", addr);
  selectedAddress = addr || null;
  if (!selectedAddress) throw new Error("No wallet address available");
  return selectedAddress;
}

export const BtcUniversity = {
  getSettings(): BtcUniSettings {
    return { ...state };
  },
  setNetwork(net: NetworkKind): BtcUniSettings {
    state.net = net;
    setPersisted(SETTINGS_KEY, state);
    return { ...state };
  },
  setContract(address: string, name: string): BtcUniSettings {
    if (!address || !name) throw new Error("Set contract address and name");
    state.ca = address.trim();
    state.cn = name.trim();
    setPersisted(SETTINGS_KEY, state);
    return { ...state };
  },
  setSbtcToken(address: string, name: string): BtcUniSettings {
    if (!address || !name)
      throw new Error("Set sBTC token contract address and name");
    state.ftCa = address.trim();
    state.ftCn = name.trim();
    setPersisted(SETTINGS_KEY, state);
    return { ...state };
  },

  // SECURITY: Check what sBTC contract is configured in the deployed contract
  async getConfiguredSbtcContract(): Promise<string | null> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "get-sbtc-contract",
      functionArgs: [],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return value?.value || null;
  },
  isConnected(): boolean {
    return !!selectedAddress;
  },
  getAddress(): string | null {
    return getSenderAddress();
  },
  async connect(): Promise<string | null> {
    try {
      const res = await request("stx_getAddresses");
      console.log("Debug - stx_getAddresses response:", res);
      selectedAddress = pickAddressForNetwork(
        (res as any)?.addresses,
        state.net
      );
      console.log("Debug - selected address after connect:", selectedAddress);
      if (!selectedAddress) throw new Error("No wallet address available");
      return selectedAddress;
    } catch (error) {
      console.error("Connect error:", error);
      throw error;
    }
  },
  disconnect(): void {
    selectedAddress = null;
  },

  // Whitelist Functions
  async enrollWhitelist(): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");
    if (!state.ftCa || !state.ftCn)
      throw new Error("Set sBTC token contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const sbtcPrincipal = Cl.contractPrincipal(state.ftCa, state.ftCn);

    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "enroll-whitelist",
      functionArgs: [sbtcPrincipal],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async addWhitelist(student: string): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "add-whitelist",
      functionArgs: [Cl.principal(student)],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async removeWhitelist(student: string): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "remove-whitelist",
      functionArgs: [Cl.principal(student)],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async isWhitelisted(student: string): Promise<boolean> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "is-whitelisted-beta",
      functionArgs: [Cl.principal(student)],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return value?.value === true;
  },

  // Instructor Management
  async addInstructor(instructor: string): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "add-instructor",
      functionArgs: [Cl.principal(instructor)],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async isInstructor(address: string): Promise<boolean> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "is-instructor",
      functionArgs: [Cl.principal(address)],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return value === true;
  },

  // Course Functions
  async addCourse(
    courseId: bigint | number | string,
    name: string,
    details: string,
    instructor: string,
    priceUint: bigint | number | string,
    maxStudents: bigint | number | string
  ): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "add-course",
      functionArgs: [
        Cl.uint(BigInt(courseId)),
        Cl.stringAscii(name),
        Cl.stringAscii(details),
        Cl.principal(instructor),
        Cl.uint(BigInt(priceUint)),
        Cl.uint(BigInt(maxStudents)),
      ],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async getCourseDetails(courseId: bigint | number | string): Promise<any> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "get-course-details",
      functionArgs: [Cl.uint(BigInt(courseId))],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return value?.value || null;
  },

  async getCourseCount(): Promise<number> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "get-course-count",
      functionArgs: [],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return Number(value?.value || 0);
  },

  async getAllCourses(): Promise<any[]> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "get-all-courses",
      functionArgs: [],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    const courses: any[] = [];
    if (Array.isArray(value?.value)) {
      for (const opt of value.value) {
        if (opt?.value) {
          courses.push(opt.value);
        }
      }
    }
    return courses;
  },

  // Enrollment Functions
  async enrollCourse(courseId: bigint | number | string): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");
    if (!state.ftCa || !state.ftCn)
      throw new Error("Set sBTC token contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const sbtcPrincipal = Cl.contractPrincipal(state.ftCa, state.ftCn);

    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "enroll-course",
      functionArgs: [Cl.uint(BigInt(courseId)), sbtcPrincipal],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async isEnrolled(
    courseId: bigint | number | string,
    student: string
  ): Promise<boolean> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "is-enrolled",
      functionArgs: [Cl.uint(BigInt(courseId)), Cl.principal(student)],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return value?.value === true;
  },

  async getEnrolledIds(student: string): Promise<number[]> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "get-enrolled-ids",
      functionArgs: [Cl.principal(student)],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    const ids: number[] = [];
    if (Array.isArray(value?.value)) {
      for (const id of value.value) {
        if (typeof id === "number" || typeof id === "bigint") {
          ids.push(Number(id));
        }
      }
    }
    return ids;
  },

  async completeCourse(
    courseId: bigint | number | string,
    student: string
  ): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "complete-course",
      functionArgs: [Cl.uint(BigInt(courseId)), Cl.principal(student)],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  // Fee Management
  async claimCourseFees(courseId: bigint | number | string): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");
    if (!state.ftCa || !state.ftCn)
      throw new Error("Set sBTC token contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const sbtcPrincipal = Cl.contractPrincipal(state.ftCa, state.ftCn);

    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "claim-course-fees",
      functionArgs: [Cl.uint(BigInt(courseId)), sbtcPrincipal],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  // Meeting Link Management
  async setMeetingLink(
    courseId: bigint | number | string,
    link: string
  ): Promise<string> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const contractId = `${state.ca}.${state.cn}` as `${string}.${string}`;
    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: "set-meeting-link",
      functionArgs: [Cl.uint(BigInt(courseId)), Cl.stringAscii(link)],
      address: sender,
      network: state.net,
      postConditionMode: "allow",
    });
    const txid = (res as any)?.txid || (res as any)?.transaction || undefined;
    if (!txid) throw new Error("No txid returned");
    return txid as string;
  },

  async getMeetingLink(courseId: bigint | number | string): Promise<string | null> {
    const sender = await getOrFetchAddress();
    if (!state.ca || !state.cn)
      throw new Error("Set contract address and name");

    const network = getNetwork();
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: state.ca,
      contractName: state.cn,
      functionName: "get-meeting-link",
      functionArgs: [Cl.uint(BigInt(courseId))],
      senderAddress: sender,
      network,
    });
    const value = cvToValue(cv) as any;
    return value?.value?.link || null;
  },
};

(globalThis as any).BtcUniversity = BtcUniversity;
