import { ExtensionContext } from 'vscode';

/**
 * Telemetry stub — this fork does not collect or send any usage data.
 * Kept as a no-op so call sites stay unchanged. To re-enable telemetry,
 * restore the @vscode/extension-telemetry based implementation with your
 * own Application Insights resource (see upstream cweijan/vscode-office).
 */
export class TelemetryService {
    private static instance: TelemetryService | undefined;

    static init(_context: ExtensionContext): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    static get(): TelemetryService | undefined {
        return TelemetryService.instance;
    }

    private constructor() { }

    trackViewOpen(_viewType: string, _fileType?: string, _properties?: Record<string, string>): void { }

    trackOfficeViewOpen(_fsPath: string, _route?: string, _fileType?: string): void { }

    trackEvent(_event: string, _properties?: Record<string, string>): void { }
}
