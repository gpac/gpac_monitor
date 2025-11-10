import { Sys as sys } from 'gpaccore';
function CommandLineManager(client) {
    this.client = client;

    /**
     * Get the command line used to start the GPAC session
     * Tries sys.args first, then reconstructs from filters if not available
     */
    this.getCommandLine = function() {
        try {
            // Method 1: Try to access sys.args directly
            if (typeof sys !== 'undefined' && sys.args) {
                if (Array.isArray(sys.args) && sys.args.length > 0) {
                    const commandLine = sys.args.join(' ');
                    return commandLine;
                }
            }
        } catch (e) {
            print("[CommandLineManager] Error getting command line: " + e);
            return null;
        }
    };



    /**
     * Send command line to client
     */
    this.sendCommandLine = function() {
        const commandLine = this.getCommandLine();

        if (commandLine) {
            this.client.client.send(JSON.stringify({
                message: 'command_line_response',
                commandLine: commandLine,
                timestamp: Date.now()
            }));
            print("[CommandLineManager] Sent command line to client: " + commandLine);
        } else {
            this.client.client.send(JSON.stringify({
                message: 'command_line_response',
                commandLine: null,
                error: 'Could not retrieve command line',
                timestamp: Date.now()
            }));
            print("[CommandLineManager] Could not retrieve command line");
        }
    };
}

export { CommandLineManager };
