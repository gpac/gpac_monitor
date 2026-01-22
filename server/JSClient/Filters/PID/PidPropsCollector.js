/**
 * PidPropsCollector
 * 
 
 */
function PidPropsCollector(client) {
  this.client = client;

  /**
   * Collect ALL properties of an Input PID via callback enumeration
   * @param {number} filterIdx - Index of destination filter
   * @param {number} ipidIdx - Index of input PID on destination filter
   * @returns {Object} Map of properties { prop_name: { type, value } }
   */
  this.collectIpidProps = function (filterIdx, ipidIdx) {
    session.lock_filters(true);

    try {
      const filter = session.get_filter(filterIdx);
      if (!filter) {
        session.lock_filters(false);
        return { error: `Filter ${filterIdx} not found` };
      }

      const properties = {};

      // Callback function to collect each property
      function collectProperty(prop_name, prop_type, prop_val) {
        properties[prop_name] = {
          name: prop_name,
          type: prop_type,
          value: prop_val,
        };
      }

      // Enumerate properties 
      filter.ipid_props(ipidIdx, collectProperty);

      session.lock_filters(false);
      return properties;
    } catch (e) {
      session.lock_filters(false);
      return { error: `Failed to enumerate IPID ${ipidIdx}: ${e.message}` };
    }
  };
}

export { PidPropsCollector };
