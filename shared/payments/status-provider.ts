// Payment status provider architecture
// This file defines the status monitoring abstraction without implementing actual payment processing

import { PaymentStatus } from './types';

/**
 * Status update event
 */
export interface StatusUpdateEvent {
  sessionId: string;
  status: PaymentStatus;
  transactionHash?: string;
  confirmations?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Status update callback
 */
export type StatusUpdateCallback = (event: StatusUpdateEvent) => void;

/**
 * Status provider interface
 */
export interface IStatusProvider {
  // Start monitoring a payment session
  startMonitoring(sessionId: string, callback: StatusUpdateCallback): void;
  
  // Stop monitoring a payment session
  stopMonitoring(sessionId: string): void;
  
  // Get current status
  getCurrentStatus(sessionId: string): Promise<PaymentStatus>;
  
  // Manual status update (for testing or admin actions)
  updateStatus(sessionId: string, status: PaymentStatus, metadata?: Record<string, unknown>): Promise<void>;
  
  // Check if provider is monitoring
  isMonitoring(sessionId: string): boolean;
}

/**
 * Polling status provider configuration
 */
export interface PollingStatusProviderConfig {
  interval: number; // in milliseconds
  maxRetries?: number;
  timeout?: number; // in milliseconds
}

/**
 * Polling status provider
 * This implements the current polling-based status monitoring
 */
export class PollingStatusProvider implements IStatusProvider {
  private config: PollingStatusProviderConfig;
  private callbacks: Map<string, StatusUpdateCallback> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private retryCount: Map<string, number> = new Map();
  private startTime: Map<string, number> = new Map();

  constructor(config: PollingStatusProviderConfig) {
    this.config = config;
  }

  startMonitoring(sessionId: string, callback: StatusUpdateCallback): void {
    this.callbacks.set(sessionId, callback);
    this.retryCount.set(sessionId, 0);
    this.startTime.set(sessionId, Date.now());
    
    // Start polling
    this.poll(sessionId);
  }

  stopMonitoring(sessionId: string): void {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
    }
    
    this.callbacks.delete(sessionId);
    this.retryCount.delete(sessionId);
    this.startTime.delete(sessionId);
  }

  async getCurrentStatus(sessionId: string): Promise<PaymentStatus> {
    // Placeholder implementation
    // In production, this would query the Payment Engine API
    console.log(`Fetching status for session: ${sessionId}`);
    return PaymentStatus.PENDING;
  }

  async updateStatus(sessionId: string, status: PaymentStatus, metadata?: Record<string, unknown>): Promise<void> {
    // Placeholder implementation
    // In production, this would update the Payment Engine database
    console.log(`Updating status for session ${sessionId} to ${status}`, metadata);
    
    // Trigger callback
    const callback = this.callbacks.get(sessionId);
    if (callback) {
      callback({
        sessionId,
        status,
        timestamp: new Date(),
        metadata,
      });
    }
  }

  isMonitoring(sessionId: string): boolean {
    return this.callbacks.has(sessionId);
  }

  private poll(sessionId: string): void {
    const interval = setInterval(async () => {
      try {
        // Check timeout
        const startTime = this.startTime.get(sessionId) || Date.now();
        if (this.config.timeout && Date.now() - startTime > this.config.timeout) {
          this.stopMonitoring(sessionId);
          return;
        }

        // Check max retries
        const retries = this.retryCount.get(sessionId) || 0;
        if (this.config.maxRetries && retries >= this.config.maxRetries) {
          this.stopMonitoring(sessionId);
          return;
        }

        // Get current status
        const currentStatus = await this.getCurrentStatus(sessionId);
        
        // Trigger callback with status update
        const callback = this.callbacks.get(sessionId);
        if (callback) {
          callback({
            sessionId,
            status: currentStatus,
            timestamp: new Date(),
          });
        }

        // Stop polling if terminal status reached
        if (this.isTerminalStatus(currentStatus)) {
          this.stopMonitoring(sessionId);
        }

        this.retryCount.set(sessionId, retries + 1);
      } catch (error) {
        console.error(`Error polling status for session ${sessionId}:`, error);
        this.retryCount.set(sessionId, (this.retryCount.get(sessionId) || 0) + 1);
      }
    }, this.config.interval);

    this.intervals.set(sessionId, interval);
  }

  private isTerminalStatus(status: PaymentStatus): boolean {
    return [
      PaymentStatus.SUCCEEDED,
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELED,
      PaymentStatus.DECLINED,
      PaymentStatus.REFUNDED,
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.CHARGEBACK,
    ].includes(status);
  }
}

/**
 * WebSocket status provider configuration
 */
export interface WebSocketStatusProviderConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket status provider
 * This defines the future WebSocket-based status monitoring
 */
export class WebSocketStatusProvider implements IStatusProvider {
  private config: WebSocketStatusProviderConfig;
  private callbacks: Map<string, StatusUpdateCallback> = new Map();
  private connections: Map<string, WebSocket> = new Map();

  constructor(config: WebSocketStatusProviderConfig) {
    this.config = config;
  }

  startMonitoring(sessionId: string, callback: StatusUpdateCallback): void {
    this.callbacks.set(sessionId, callback);
    
    // Placeholder for WebSocket connection
    // In production, this would establish a WebSocket connection
    console.log(`Starting WebSocket monitoring for session: ${sessionId}`);
  }

  stopMonitoring(sessionId: string): void {
    const connection = this.connections.get(sessionId);
    if (connection) {
      connection.close();
      this.connections.delete(sessionId);
    }
    
    this.callbacks.delete(sessionId);
  }

  async getCurrentStatus(sessionId: string): Promise<PaymentStatus> {
    // Placeholder implementation
    // In production, this would query the WebSocket connection
    return PaymentStatus.PENDING;
  }

  async updateStatus(sessionId: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<void> {
    // Placeholder implementation
    // In production, this would send status update via WebSocket
    console.log(`Updating status via WebSocket for session ${sessionId} to ${status}`);
  }

  isMonitoring(sessionId: string): boolean {
    return this.callbacks.has(sessionId);
  }
}

/**
 * Blockchain event status provider configuration
 */
export interface BlockchainEventProviderConfig {
  networks: string[];
  rpcUrls: Record<string, string>;
  wsUrls: Record<string, string>;
}

/**
 * Blockchain event status provider
 * This defines the future blockchain event-based status monitoring
 */
export class BlockchainEventProvider implements IStatusProvider {
  private config: BlockchainEventProviderConfig;
  private callbacks: Map<string, StatusUpdateCallback> = new Map();
  private subscriptions: Map<string, any> = new Map();

  constructor(config: BlockchainEventProviderConfig) {
    this.config = config;
  }

  startMonitoring(sessionId: string, callback: StatusUpdateCallback): void {
    this.callbacks.set(sessionId, callback);
    
    // Placeholder for blockchain event subscription
    // In production, this would subscribe to blockchain events
    console.log(`Starting blockchain event monitoring for session: ${sessionId}`);
  }

  stopMonitoring(sessionId: string): void {
    const subscription = this.subscriptions.get(sessionId);
    if (subscription) {
      // Unsubscribe from blockchain events
      this.subscriptions.delete(sessionId);
    }
    
    this.callbacks.delete(sessionId);
  }

  async getCurrentStatus(sessionId: string): Promise<PaymentStatus> {
    // Placeholder implementation
    // In production, this would query blockchain events
    return PaymentStatus.PENDING;
  }

  async updateStatus(sessionId: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<void> {
    // Placeholder implementation
    // In production, this would trigger blockchain event handling
    console.log(`Updating status via blockchain events for session ${sessionId} to ${status}`);
  }

  isMonitoring(sessionId: string): boolean {
    return this.callbacks.has(sessionId);
  }
}

/**
 * Status provider factory
 */
export class StatusProviderFactory {
  private static defaultProvider: IStatusProvider | null = null;

  static getDefaultProvider(): IStatusProvider {
    if (!this.defaultProvider) {
      this.defaultProvider = new PollingStatusProvider({
        interval: 5000, // 5 seconds
        maxRetries: 120, // 10 minutes
        timeout: 600000, // 10 minutes
      });
    }
    return this.defaultProvider;
  }

  static createPollingProvider(config: PollingStatusProviderConfig): IStatusProvider {
    return new PollingStatusProvider(config);
  }

  static createWebSocketProvider(config: WebSocketStatusProviderConfig): IStatusProvider {
    return new WebSocketStatusProvider(config);
  }

  static createBlockchainEventProvider(config: BlockchainEventProviderConfig): IStatusProvider {
    return new BlockchainEventProvider(config);
  }
}
