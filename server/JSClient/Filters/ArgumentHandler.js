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
            print("Error: Filter with idx " + idx + " not found");
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

            print("Successfully updated argument '" + argName +
                  "' for filter " + filter.name + " (idx=" + idx + ")");
        } catch (e) {
            print("Error: Failed to update argument: " + e.toString());
        }
    };
}

export { ArgumentHandler };
