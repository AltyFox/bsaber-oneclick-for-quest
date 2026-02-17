export interface ADBStatus {
    isInstalled: boolean;
    version?: string;
    error?: string;
}

export interface QuestConnection {
    serialNumber: string;
    isConnected: boolean;
    error?: string;
}