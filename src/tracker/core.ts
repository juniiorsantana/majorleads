
// src/tracker/core.ts
import { setupEventListeners } from './events';

interface LeadSenseConfig {
    token: string;
    endpoint: string;
}

interface LeadSenseEvent {
    event: string;
    properties?: Record<string, any>;
    timestamp: number;
}

declare global {
    interface Window {
        LeadSense: any;
    }
}

class LeadSenseTracker {
    private config: LeadSenseConfig;
    private queue: LeadSenseEvent[] = [];
    private isInitialized = false;

    constructor() {
        this.config = {
            token: '',
            endpoint: 'https://api.leadsense.io/v1/events', // Default endpoint
        };
    }

    public init(token: string) {
        if (this.isInitialized) return;

        this.config.token = token;
        this.isInitialized = true;

        console.log(`LeadSense Tracker initialized with token: ${token}`);

        // Process existing queue from window.LeadSense
        this.processInitialQueue();

        // Start capturing events
        this.captureSession();

        // Setup DOM Listeners
        setupEventListeners();
    }

    public track(eventName: string, properties: Record<string, any> = {}) {
        const event: LeadSenseEvent = {
            event: eventName,
            properties,
            timestamp: Date.now(),
        };

        this.queue.push(event);
        this.flush();
    }

    public identify(traits: Record<string, any>) {
        this.track('identify', traits);
    }

    private processInitialQueue() {
        const existing = window.LeadSense || {};
        const queue = existing._queue || [];

        // Replace global object with this instance
        window.LeadSense = this;

        // Replay queue
        if (Array.isArray(queue)) {
            queue.forEach((args: any[]) => {
                if (args && args.length > 0) {
                    const method = args[0];
                    if (typeof this[method as keyof LeadSenseTracker] === 'function') {
                        // @ts-ignore
                        this[method](...args.slice(1));
                    }
                }
            });
        }
    }

    private captureSession() {
        this.track('session_start', {
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
        });
    }

    private flush() {
        if (this.queue.length === 0) return;

        // console.log('Flushing events:', this.queue);
        // TODO: Implement actual network request
        // fetch(this.config.endpoint, ...)

        this.queue = [];
    }
}

// Singleton instance
const tracker = new LeadSenseTracker();

// Basic snippet compatibility
const existing = window.LeadSense || {};
if (existing._token) {
    tracker.init(existing._token);
}

// Expose to window
window.LeadSense = tracker;

export default tracker;
