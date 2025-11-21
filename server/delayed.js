// delayed.js - Simple stall test filter
filter.set_name("Delayed");
filter.set_cap({id: "StreamType", value: "Visual", in: true, out: true});

filter.pck_count = 0;
filter.opid = null;

filter.configure_pid = function(pid) {
    if (!this.opid) {
        this.opid = this.new_pid();
    }
    this.opid.copy_props(pid);
    return GF_OK;
};

filter.process = function(pid) {
    let pck = pid.get_packet();
    if (!pck) return GF_OK;

    this.pck_count++;

    // Block packets 5-15 (simulates ~2s stall at 10fps)
    if (this.pck_count >= 5 && this.pck_count <= 15) {
        return GF_OK;
    }

    this.opid.forward(pck);
    pid.drop_packet();
    return GF_OK;
};
