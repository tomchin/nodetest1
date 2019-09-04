//!!</COPYRIGHT>

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.set('port', 8028)

app.use(bodyParser.json());
app.get('/json', (req, res) => res.json({ errcode: 200, errmsg: 'OK' }));
let port = process.env.PORT || app.get('port')
const server = app.listen(port)
server.on('listening', () => console.log(`Server listening on port ${port}!`));

var read_counter = 0
function onRead() {
    read_counter++;
    console.log('=> read ' + read_counter);
}
function onWrite(data) {
    read_counter = data;
    console.log('On write ' + read_counter);
    // broadcast to all
    io.emit('notify', { msg: read_counter, agent: "all" });
}

app.route('/space')
    .get((req, res) => {
        onWrite(0);
        res.json({ errcode: 221, errmsg: 'OK' })
    })
    .post((req, res) => {
        onWrite(req.body.data);
        res.json({ errcode: 222, errmsg: 'OK' })
    })
app.get('*', (req, res) => res.send("OK"));

const io = require("socket.io")(server)
io.on('connection', (socket) => {
    console.log('server connected')

    socket.on('read', (data) => {
        onRead();
        socket.emit('notify', { msg: read_counter, agent: data });
    })

    socket.on('write', (data) => {
        onWrite(data);
    })

    // built-in listener (life cycle events)
    socket.on("disconnect", () => {
        console.log("server disconnected");
        // broadcast to all except itself (the sender)
        socket.broadcast.emit('notify', { msg: read_counter, agent: "all" })
    });
})

onRead()

process.on('SIGINT', () => {
    console.log('Server closed!');
});