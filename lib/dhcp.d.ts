// Definitions by: Cameron Tacklind <cameron@tacklind.com> & GPT-4o

import { EventEmitter } from "events";

// Define common types for better clarity and reusability
type IpAddress = string;
type MacAddress = string;

// Define a common type for unsigned 32-bit integers
type Uint32 = number;

// Define a shared type for DHCP feature
type DhcpFeature =
  | "hostname"
  | "dns"
  | "router"
  | "netmask"
  | "broadcast"
  | "leaseTime"
  | "renewalTime"
  | "rebindingTime";

// Define additional common types for better clarity and reusability
type DhcpMessageType = 'DHCPDISCOVER' | 'DHCPOFFER' | 'DHCPREQUEST' | 'DHCPDECLINE' | 'DHCPACK' | 'DHCPNAK' | 'DHCPRELEASE' | 'DHCPINFORM';

/**
 * Configuration options for the DHCP server
 */
interface ServerConfig {
  /**
   * Two element array representing the IP range the server operates on
   * @example ["192.168.1.2", "192.168.1.99"]
   */
  range?: [IpAddress, IpAddress];

  /**
   * Array of options that are forced to be sent, even if not requested
   */
  forceOptions?: DhcpFeature[];

  /**
   * If true, selects a random new IP from the pool instead of keeping one IP
   * @default false
   */
  randomIP?: boolean;

  /**
   * A static IP binding object of the form `mac -> ip`
   * @example { "11:22:33:44:55:66": "192.168.1.100" }
   */
  static?: Record<MacAddress, IpAddress>;

  /**
   * The subnet mask for the network
   * @example "255.255.255.0"
   */
  netmask?: IpAddress;

  /**
   * Array of router IP addresses
   * @example ["192.168.1.1"]
   */
  router?: IpAddress[];

  /**
   * The time server address or null if not set
   * @default null
   */
  timeServer?: IpAddress | null;

  /**
   * The name server address or null if not set
   * @default null
   */
  nameServer?: IpAddress | null;

  /**
   * Array of DNS server addresses
   * @example ["8.8.8.8", "8.8.4.4"]
   */
  dns?: IpAddress[];

  /**
   * The hostname to be assigned to clients
   */
  hostname?: string;

  /**
   * The domain name to be assigned to clients
   */
  domainName?: string;

  /**
   * The broadcast address for the network
   * @example "192.168.1.255"
   */
  broadcast?: IpAddress;

  /**
   * The server's IP address
   * @example "192.168.1.1"
   */
  server?: IpAddress;

  /**
   * The maximum DHCP message size
   * @default 1500
   * @unit bytes
   */
  maxMessageSize?: Uint32;

  /**
   * The lease time for IP addresses
   * @default 86400
   * @unit seconds
   */
  leaseTime?: Uint32;

  /**
   * The renewal time for IP addresses
   * @default 3600
   * @unit seconds
   */
  renewalTime?: Uint32;

  /**
   * The rebinding time for IP addresses
   * @default 14400
   * @unit seconds
   */
  rebindingTime?: Uint32;

  /**
   * A function to determine the boot file name for PXE boot
   * @param req - The DHCP request object
   * @param res - The DHCP response object
   * @returns The name of the boot file
   */
  bootFile?: (req: DhcpRequest, res: DhcpResponse) => string;
}

interface ClientConfig {
  mac?: MacAddress;
  features?: DhcpFeature[];
}

type ConfigValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null
  | ((this: { config: (key: string) => ConfigValue }) => ConfigValue);

/**
 * Represents a DHCP option
 */
interface DhcpOption {
  /**
   * A string description of the option
   */
  name: string;

  /**
   * A type, which is used by SeqBuffer to parse the option
   * @example "UInt8", "ASCII", "IP"
   */
  type: "UInt8" | "ASCII" | "IP" | "IPs" | "UInt16" | "UInt32" | "Bool";

  /**
   * The name of the configuration option
   * @example "netmask", "dns", "router"
   */
  config?: string;

  /**
   * When a client sends data and an option has no configuration, this is the attribute name for the option
   */
  attr?: string;

  /**
   * Gets passed if no configuration is supplied for the option
   * Can be a value or a function
   */
  default?: ConfigValue;

  /**
   * Represents a map of possible enum values for this option
   * @example { 0: "Disabled", 1: "Enabled" }
   */
  enum?: Record<number | string, string>;
}

/**
 * Represents a DHCP request
 */
interface DhcpRequest {
  /**
   * The client identifier
   */
  clientId?: string;

  /**
   * A record of DHCP options sent by the client
   */
  options: Record<number, string | number | boolean | string[] | number[]>;

  /**
   * The client hardware address (MAC address)
   */
  chaddr?: MacAddress;

  /**
   * The transaction ID for the request
   */
  xid?: number;

  /**
   * The client IP address (if already assigned)
   */
  ciaddr?: IpAddress;

  /**
   * The 'your' client IP address (offered by the server)
   */
  yiaddr?: IpAddress;

  /**
   * The server IP address
   */
  siaddr?: IpAddress;

  /**
   * The gateway/relay agent IP address
   */
  giaddr?: IpAddress;
}

/**
 * Represents a DHCP response
 */
interface DhcpResponse {
  /**
   * The IP address allocated to the client
   */
  ip: IpAddress;
}

/**
 * Represents a DHCP server
 * @extends EventEmitter
 */
declare class Server extends EventEmitter {
  /**
   * Creates a new DHCP server instance
   * @param {ServerConfig} config - The configuration options for the server
   * @param {boolean} [listenOnly=false] - If true, the server only listens for messages without responding
   */
  constructor(config: ServerConfig, listenOnly?: boolean);

  /**
   * Starts the server and begins listening for DHCP messages
   * @param {number} [port=67] - The port to listen on
   * @param {string} [host='0.0.0.0'] - The host to bind to
   * @param {() => void} [callback] - A callback function to execute once the server starts listening
   */
  listen(port?: number, host?: string, callback?: () => void): void;

  /**
   * Closes the server and stops listening for DHCP messages
   * @param {() => void} [callback] - A callback function to execute once the server is closed
   */
  close(callback?: () => void): void;
}

/**
 * Represents a DHCP client
 * @extends EventEmitter
 */
declare class Client extends EventEmitter {
  /**
   * Creates a new DHCP client instance
   * @param {ClientConfig} [config] - The configuration options for the client
   */
  constructor(config?: ClientConfig);

  /**
   * Sends a DHCPDISCOVER message to initiate the DHCP process
   */
  sendDiscover(): void;

  /**
   * Sends a DHCPREQUEST message to request an IP address
   * @param {DhcpRequest} req - The DHCP request object
   */
  sendRequest(req: DhcpRequest): void;

  /**
   * Sends a DHCPRELEASE message to release an IP address
   * @param {DhcpRequest} req - The DHCP request object
   */
  sendRelease(req: DhcpRequest): void;

  /**
   * Sends a DHCPREQUEST message to renew an IP address lease
   */
  sendRenew(): void;

  /**
   * Sends a DHCPREQUEST message to rebind an IP address lease
   */
  sendRebind(): void;

  /**
   * Starts the client and begins listening for DHCP messages
   * @param {number} [port=68] - The port to listen on
   * @param {string} [host='0.0.0.0'] - The host to bind to
   * @param {() => void} [callback] - A callback function to execute once the client starts listening
   */
  listen(port?: number, host?: string, callback?: () => void): void;

  /**
   * Closes the client and stops listening for DHCP messages
   * @param {() => void} [callback] - A callback function to execute once the client is closed
   */
  close(callback?: () => void): void;
}

// Simplified module declaration that aligns with both CommonJS and ESM usage
declare namespace dhcp {
  export const DHCPDISCOVER: number;
  export const DHCPOFFER: number;
  export const DHCPREQUEST: number;
  export const DHCPDECLINE: number;
  export const DHCPACK: number;
  export const DHCPNAK: number;
  export const DHCPRELEASE: number;
  export const DHCPINFORM: number;
  
  export function createServer(config: ServerConfig): Server;
  export function createClient(config?: ClientConfig): Client;
  export function createBroadcastHandler(): Server;
  export function addOption(code: number, opt: DhcpOption): void;
  
  // Export DHCP namespace as it is in the JS file
  export const DHCP: typeof dhcp;
  
  // Export ServerConfig and other types for external use
  export { ServerConfig, ClientConfig, DhcpOption, DhcpRequest, DhcpResponse };
}

export = dhcp;

// cSpell:words DHCPDISCOVER DHCPOFFER DHCPREQUEST DHCPDECLINE DHCPACK DHCPNAK DHCPRELEASE DHCPINFORM
// cSpell:words chaddr ciaddr yiaddr siaddr giaddr
