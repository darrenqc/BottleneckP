hasProp = {}.hasOwnProperty;

var Cluster = function(maxConcurrent, rateLimit, priorityRange) {
    this.maxConcurrent = maxConcurrent;
    this.rateLimit = rateLimit;
    this.priorityRange = priorityRange;
    this.limiters = {};
    this.Bottleneck = require("./Bottleneck");
}

Cluster.prototype.key = function(key) {
    var ref;
    if (key == null) {
        key = "";
    }
    return (ref = this.limiters[key]) != null ? ref : (this.limiters[key] = new this.Bottleneck(this.maxConcurrent, this.rateLimit, this.priorityRange));
};

Cluster.prototype.deleteKey = function(key) {
    if (key == null) {
        key = "";
    }
    return delete this.limiters[key];
};

Cluster.prototype.all = function(cb) {
    var k, ref, results, v;
    ref = this.limiters;
    results = [];
    for (k in ref) {
        if (!hasProp.call(ref, k)) continue;
        v = ref[k];
        results.push(cb(v));
    }
    return results;
};

Cluster.prototype.keys = function() {
    return Object.keys(this.limiters);
};

Cluster.prototype.startAutoCleanup = function() {
    var base;
    this.stopAutoCleanup();
    return typeof (base = (this.interval = setInterval((function(_this) {
        return function() {
            var k, ref, results, time, v;
            time = Date.now();
            ref = _this.limiters;
            results = [];
            for (k in ref) {
                v = ref[k];
                if ((v._nextRequest + (1000 * 60 * 5)) < time) {
                  results.push(_this.deleteKey(k));
                } else {
                  results.push(void 0);
                }
            }
            return results;
        };
    })(this), 1000 * 30))).unref === "function" ? base.unref() : void 0;
};

Cluster.prototype.stopAutoCleanup = function() {
    return clearInterval(this.interval);
};

module.exports = Cluster;