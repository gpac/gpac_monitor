import { Sys as sys } from 'gpaccore'

let logs=[];
sys.on_log = function(tool, level, msg) {
    logs.push( '' + tool + '@'+level+ ': ' + msg);
};

sys.set_logs("all@info");
print('=== SESSION DEBUG TEST ===');
print('Original logs: ' + sys.get_logs(true));
print('Current logs: ' + sys.get_logs());

// Add filters for test
session.add_filter("src=/media/pierre/6a7e4524-19ba-4eb4-9ac2-04ff64b3e10a5/projets/GPAC/gpac-graph/media/source.mp4");
session.add_filter("vout:vsync=0");

print('Initial filters count: ' + session.nb_filters);

let taskCount = 0;
session.post_task( (f) => {
    taskCount++;
    
    print(`\n--- Task ${taskCount} ---`);
    print('session.last_task: ' + session.last_task);
    print('session.nb_filters: ' + session.nb_filters);
    
    // Log filter states
    session.lock_filters(true);
    for (let i = 0; i < session.nb_filters; i++) {
        const filter = session.get_filter(i);
        print(`Filter ${i}: name=${filter.name}, type=${filter.type}, status=${filter.status}, destroyed=${filter.is_destroyed()}`);
    }
    session.lock_filters(false);
    
    if (session.last_task) {
        print('\n=== SESSION FINISHED ===');
        print('Final filters count: ' + session.nb_filters);
        print('Total logs collected: ' + logs.length);
        
        // Log final filter states
        session.lock_filters(true);
        for (let i = 0; i < session.nb_filters; i++) {
            const filter = session.get_filter(i);
            print(`Final Filter ${i}: name=${filter.name}, destroyed=${filter.is_destroyed()}`);
        }
        session.lock_filters(false);
        
        return false;
    }
    
    print('Recent logs count: ' + logs.length);
    if (logs.length > 10) {
        print('Last few logs:');
        logs.slice(-5).forEach(log => print('  ' + log));
    }
    logs = []; // Clear for next iteration
    
    return 1000; // Check every second
});