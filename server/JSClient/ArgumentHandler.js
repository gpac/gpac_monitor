import { gpac_filter_to_object } from '../filterUtils.js';

function ArgumentHandler(client) {
    this.client = client;

    this.sendDetails = function(idx) {
        session.post_task(() => {
            let Args = [];

            session.lock_filters(true);
            for (let i = 0; i < session.nb_filters; i++) {
                let f = session.get_filter(i);
                if (f.idx == idx) {
                    const fullObj = gpac_filter_to_object(f, true);
                    Args = fullObj.gpac_args;
                    break;
                }
            }
            session.lock_filters(false);

            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'details',
                    filter: {
                        idx: idx,
                        gpac_args: Args
                    }
                }));
            }
            return false;
        });
    };

    this.updateArgument = function(idx, name, argName, newValue) {
        let filter = session.get_filter('' + idx);

        if (!filter) {
            const errorMsg = "Filter with idx " + idx + " not found";
            print("Error: " + errorMsg);

            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'update_arg_response',
                    idx: idx,
                    argName: argName,
                    requestedValue: newValue,
                    actualValue: null,
                    success: false,
                    error: errorMsg
                }));
            }
            return;
        }

        if (filter.name != name) {
            print("Warning: Discrepancy in filter names for idx " + idx +
                  ". Expected '" + name + "', found '" + filter.name +
                  "'. Proceeding with update.");
        }

        try {
            print("Updating filter " + idx + " (" + filter.name +
                  "), argument '" + argName + "' to '" + newValue + "'");

            filter.update(argName, newValue);

            let actualValue = filter.get_arg(argName);

            let normalizedValue = actualValue;
            if (actualValue !== null && typeof actualValue === 'object') {
                if ('n' in actualValue && 'd' in actualValue) {
                    normalizedValue = actualValue.n + '/' + actualValue.d;
                } else if ('num' in actualValue && 'den' in actualValue) {
                    normalizedValue = actualValue.num + '/' + actualValue.den;
                } else {
                    normalizedValue = JSON.stringify(actualValue);
                }
            } else if (typeof actualValue === 'boolean') {
                normalizedValue = actualValue ? 'true' : 'false';
            } else {
                normalizedValue = String(actualValue);
            }

            print("Read-after-write: argument '" + argName +
                  "' actual value is '" + normalizedValue + "'");

            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'update_arg_response',
                    idx: idx,
                    argName: argName,
                    requestedValue: newValue,
                    actualValue: normalizedValue,
                    success: true,
                    error: null
                }));
            }
        } catch (e) {
            const errorMsg = "Failed to update argument: " + e.toString();
            print("Error: " + errorMsg);

            if (this.client.client) {
                this.client.client.send(JSON.stringify({
                    message: 'update_arg_response',
                    idx: idx,
                    argName: argName,
                    requestedValue: newValue,
                    actualValue: null,
                    success: false,
                    error: errorMsg
                }));
            }
        }
    };
}

export { ArgumentHandler };
