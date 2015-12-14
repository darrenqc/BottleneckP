var PriorityQueue = function(size) {
    var me = {}, slots, i, total = null;

    // initialize arrays to hold queue elements
    size = Math.max(+size | 0, 1);
    slots = [];
    for (i = 0; i < size; i += 1) {
        slots.push([]);
    }

    //  Public methods
    me.size = function () {
        var i;
        if (total === null) {
            total = 0;
            for (i = 0; i < size; i += 1) {
                total += slots[i].length;
            }
        }
        return total;
    };

    me.enqueue = function (obj, priority) {
        var priorityOrig;

        // Convert to integer with a default value of 0.
        priority = priority && + priority | 0 || 0;

        // Clear cache for total.
        total = null;
        if (priority) {
            priorityOrig = priority;
            if (priority < 0 || priority >= size) {
                priority = (size - 1);
                // put obj at the end of the line
                console.error("invalid priority: " + priorityOrig + " must be between 0 and " + priority);
            }
        }

        slots[priority].push(obj);
    };

    me.dequeue = function (callback) {
        var obj = null, i, sl = slots.length;

        // Clear cache for total.
        total = null;
        for (i = 0; i < sl; i += 1) {
            if (slots[i].length) {
                obj = slots[i].shift();
                break;
            }
        }
        return obj;
    };

    return me;
};

function Bottleneck(maxConcurrent, rateLimit, priorityRange) {
    if(isNaN(maxConcurrent) || isNaN(rateLimit)) {
        throw "maxConcurrent and rateLimit must be numbers";
    }
    this.rateLimit = parseInt(rateLimit);
    this.maxConcurrent = this.rateLimit ? 1 : parseInt(maxConcurrent);
    this._waitingClients = new PriorityQueue(priorityRange || 1);
    this._priorityRange = priorityRange || 1;
    this._nextRequest = Date.now();
    this._tasksRunning = 0;
}

Bottleneck.prototype.submit = function(clientCallback, priority) {
    var self = this;
    priority = priority && + priority | 0 || 0;
    priority = priority > self._priorityRange-1 ? self._priorityRange-1 : priority;
    this._waitingClients.enqueue(clientCallback, priority);
    self._tryToRun();
    return;
}

Bottleneck.prototype._tryToRun = function() {
    var self = this;
    if(self._tasksRunning < self.maxConcurrent && self._waitingClients.size()) {
        ++self._tasksRunning;
        var wait = Math.max(this._nextRequest - Date.now(), 0);
        self._nextRequest = Date.now() + wait + self.rateLimit;
        var next = self._waitingClients.dequeue();
        setTimeout(function(){
            var done = function() {
                --self._tasksRunning;
                self._tryToRun();
            }
            next(done);
        }, wait);
    }
    return;
}

Bottleneck.Cluster = Bottleneck.prototype.Cluster = require("./Cluster");

module.exports = Bottleneck;