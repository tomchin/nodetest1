//!!</COPYRIGHT>

const cluster = require('cluster');
const axios = require('axios');

// connect to both server3 & server4
const url_str = "http://localhost:8028";
const NUM_WORKER = require('os').cpus().length - 1;
const DEBUG_LOG = false;

const sleep = (m) => new Promise(resolve => setTimeout(resolve, m + Math.random() * m));

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    for (let i = 1; i <= NUM_WORKER; i++) {
        cluster.fork();
    }
    setInterval(Master_write, 3000)
} else {
    console.log(`Worker ${cluster.worker.id} started`);
}

const io = require("socket.io-client")
const socket = io(url_str)

// built-in listener (life cycle events)
socket.on("connect", () => {
    console.log('client connected')
});

// server3 listener
socket.on('notify', (msg) => {
    print_dot('.', ".. notify " + JSON.stringify(msg));
    if (!cluster.isMaster && msg.agent == "all") Worker_read();
})

// server4 (feather) listener https://docs.feathersjs.com/api/client/socketio.html
socket.on('space created', (msg) => {
    print_dot('.', ".. created " + JSON.stringify(msg));
    if (!cluster.isMaster) {
        let data = "#" + cluster.worker.id
        print_dot('-', "=> read " + data);
        socket.emit('find', 'space');
    }
})

// built-in listener (life cycle events)
socket.on("disconnect", () => {
    console.log("client disconnected");
});

async function Master_write() {
    try {
        await sleep(2000);
        let data = 0
        print_dot('*', "On write " + data);
        //        socket.emit('write', data)
        await axios.post(url_str + "/space", { data: data });
    } catch (err) {
        print_dot('?', `Err1: ${err.message}`);
        process.exit(1);
    }
}

var working = false;
async function Worker_read() {
    if (working) return
    try {
        working = true
        await sleep(1000);
        let data = "#" + cluster.worker.id
        print_dot('-', "=> read " + data);
        socket.emit('read', data);
    } catch (err) {
        print_dot('?', `Err2: ${err.message}`);
    }
    working = false
}

function print_dot(dot_char, log_str) {
    if (DEBUG_LOG) {
        console.log(log_str);
    } else {
        process.stdout.write(dot_char);
    }
}

process.on('SIGINT', () => {
    process.exit(0);
});
